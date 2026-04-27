"""
Open Library API Integration

Fetches book data from Open Library (openlibrary.org)
Free API with no authentication required
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Base URLs
OPEN_LIBRARY_API = "https://openlibrary.org"
OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org"

# Cache for API responses (1 hour TTL)
_cache = TTLCache(maxsize=1000, ttl=3600)

# Rate limiting
_last_request_time = 0
_min_request_interval = 0.1  # 100ms between requests


class OpenLibraryService:
    """Service for fetching book data from Open Library"""

    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=OPEN_LIBRARY_API,
            timeout=30.0,
            headers={"User-Agent": "StoryScout/1.0 (children's book recommendations)"}
        )

    async def _rate_limited_get(self, url: str, params: dict = None) -> Optional[dict]:
        """Make a rate-limited GET request"""
        global _last_request_time

        # Rate limiting
        now = asyncio.get_event_loop().time()
        elapsed = now - _last_request_time
        if elapsed < _min_request_interval:
            await asyncio.sleep(_min_request_interval - elapsed)

        _last_request_time = asyncio.get_event_loop().time()

        # Check cache
        cache_key = f"{url}:{params}"
        if cache_key in _cache:
            return _cache[cache_key]

        try:
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            _cache[cache_key] = data
            return data
        except httpx.HTTPError as e:
            logger.error(f"Open Library API error: {e}")
            return None

    async def search_books(
        self,
        query: str,
        subject: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search for books

        Args:
            query: Search query (title, author, etc.)
            subject: Subject/category filter
            limit: Max results to return
        """
        params = {
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,cover_i,subject,isbn,number_of_pages_median,publisher",
        }

        if subject:
            params["subject"] = subject

        data = await self._rate_limited_get("/search.json", params)

        if not data or "docs" not in data:
            return []

        return data["docs"]

    async def search_children_books(
        self,
        query: str = "*",
        age_group: str = "juvenile",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Search specifically for children's books

        Args:
            query: Search query
            age_group: "juvenile", "picture_books", "young_adult"
            limit: Max results
        """
        # Subject mappings for children's books
        subject_queries = {
            "juvenile": "juvenile fiction",
            "picture_books": "picture books",
            "young_adult": "young adult fiction",
        }

        subject = subject_queries.get(age_group, "juvenile fiction")

        params = {
            "q": query,
            "subject": subject,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,cover_i,subject,isbn,number_of_pages_median,publisher",
            "sort": "rating desc",
        }

        data = await self._rate_limited_get("/search.json", params)

        if not data or "docs" not in data:
            return []

        return data["docs"]

    async def get_work(self, work_key: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed work information

        Args:
            work_key: Open Library work key (e.g., "/works/OL45883W")
        """
        # Ensure key starts with /works/
        if not work_key.startswith("/works/"):
            work_key = f"/works/{work_key}"

        data = await self._rate_limited_get(f"{work_key}.json")
        return data

    async def get_author(self, author_key: str) -> Optional[Dict[str, Any]]:
        """
        Get author information

        Args:
            author_key: Open Library author key (e.g., "/authors/OL23919A")
        """
        if not author_key.startswith("/authors/"):
            author_key = f"/authors/{author_key}"

        data = await self._rate_limited_get(f"{author_key}.json")
        return data

    def get_cover_url(
        self,
        cover_id: Optional[int] = None,
        isbn: Optional[str] = None,
        size: str = "M"
    ) -> Optional[str]:
        """
        Get cover image URL

        Args:
            cover_id: Open Library cover ID
            isbn: Book ISBN
            size: "S" (small), "M" (medium), "L" (large)

        Returns:
            URL to cover image or None
        """
        if cover_id:
            return f"{OPEN_LIBRARY_COVERS}/b/id/{cover_id}-{size}.jpg"
        elif isbn:
            return f"{OPEN_LIBRARY_COVERS}/b/isbn/{isbn}-{size}.jpg"
        return None

    async def get_subjects(self, subject: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get books by subject

        Args:
            subject: Subject name (e.g., "picture_books", "bedtime")
            limit: Max results
        """
        # Format subject for URL
        subject_slug = subject.lower().replace(" ", "_")

        data = await self._rate_limited_get(
            f"/subjects/{subject_slug}.json",
            params={"limit": limit}
        )

        if not data or "works" not in data:
            return []

        return data["works"]

    def parse_book_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Open Library data into our book format

        Args:
            raw_data: Raw data from Open Library API

        Returns:
            Parsed book data matching our Book model
        """
        # Get cover URL
        cover_id = raw_data.get("cover_i") or raw_data.get("cover_id")
        isbn_list = raw_data.get("isbn", [])
        isbn = isbn_list[0] if isbn_list else None

        cover_url = self.get_cover_url(cover_id=cover_id, isbn=isbn, size="M")

        # Get author
        authors = raw_data.get("author_name", [])
        author = authors[0] if authors else "Unknown Author"

        # Estimate reading time from page count
        pages = raw_data.get("number_of_pages_median") or raw_data.get("number_of_pages")
        if pages:
            # Rough estimate: 2 pages per minute for children's books
            reading_time = max(5, min(30, pages // 2))
        else:
            reading_time = 10  # Default

        # Map subjects to our themes
        subjects = raw_data.get("subject", [])
        themes = self._map_subjects_to_themes(subjects)

        # Determine age range from subjects, page count, and title
        title = raw_data.get("title", "")
        age_range = self._determine_age_range(subjects, pages, title)

        # Determine moods from subjects/title
        moods = self._determine_moods(subjects, raw_data.get("title", ""))

        return {
            "title": raw_data.get("title", "Unknown Title"),
            "author": author,
            "cover_url": cover_url,
            "cover_id": str(cover_id) if cover_id else None,
            "age_range": age_range,
            "reading_time_minutes": reading_time,
            "themes": themes,
            "moods": moods,
            "reading_type": "both",
            "description": self._extract_description(raw_data),
            "page_count": pages,
            "isbn": isbn,
            "open_library_key": raw_data.get("key"),
            "publisher": raw_data.get("publisher", [None])[0] if isinstance(raw_data.get("publisher"), list) else raw_data.get("publisher"),
            "publish_year": raw_data.get("first_publish_year"),
            "is_active": True,
            "popularity_score": raw_data.get("ratings_average", 0) or 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

    def _map_subjects_to_themes(self, subjects: List[str]) -> List[str]:
        """Map Open Library subjects to our theme categories"""
        themes = set()
        subject_lower = [s.lower() for s in subjects[:50]]  # Limit to first 50

        theme_keywords = {
            "kindness": ["kindness", "kind", "caring", "helping", "sharing", "empathy"],
            "adventure": ["adventure", "quest", "journey", "exploration", "travel"],
            "bedtime": ["bedtime", "sleep", "dreams", "night", "moon", "stars"],
            "emotions": ["emotions", "feelings", "sad", "happy", "angry", "fear", "love"],
            "animals": ["animals", "pets", "dogs", "cats", "bears", "rabbits", "farm"],
            "learning": ["learning", "education", "counting", "alphabet", "colors", "shapes", "science"],
            "humor": ["humor", "funny", "comedy", "silly", "jokes", "laughing"],
            "friendship": ["friendship", "friends", "best friends", "social"],
            "nature": ["nature", "trees", "forest", "garden", "seasons", "weather", "ocean"],
            "family": ["family", "parents", "siblings", "grandparents", "home"],
        }

        for theme, keywords in theme_keywords.items():
            for keyword in keywords:
                if any(keyword in subj for subj in subject_lower):
                    themes.add(theme)
                    break

        return list(themes) if themes else ["adventure"]  # Default to adventure

    def _determine_age_range(self, subjects: List[str], pages: int = None, title: str = "") -> str:
        """Determine age range from subjects, page count, and title"""
        subject_lower = " ".join(subjects[:30]).lower()
        title_lower = title.lower()

        # Board books / Baby books (Ages 2-3)
        if any(term in subject_lower for term in ["board book", "baby", "toddler", "infant"]):
            return "2-3"

        # Chapter books / Middle grade (Ages 8-10)
        # Check these BEFORE picture books since some may have both tags
        chapter_indicators = [
            "chapter book", "middle grade", "ages 8-12", "ages 9-12", "ages 8-10",
            "grade 3", "grade 4", "grade 5", "third grade", "fourth grade", "fifth grade",
            "juvenile fiction -- series", "children's series"
        ]
        # Series names that are clearly chapter books
        chapter_series = [
            "diary of a wimpy kid", "dog man", "captain underpants", "geronimo stilton",
            "goosebumps", "percy jackson", "magic tree house", "big nate", "dork diaries",
            "bad guys", "wimpy kid", "ramona", "junie b", "judy moody", "stink",
            "wayside school", "a to z mysteries", "cam jansen", "horrible harry",
            "ivy and bean", "clementine", "flat stanley"
        ]
        if any(term in subject_lower for term in chapter_indicators):
            return "8-10"
        if any(series in title_lower for series in chapter_series):
            return "8-10"
        if any(series in subject_lower for series in chapter_series):
            return "8-10"
        # Longer books are likely chapter books
        if pages and pages > 80:
            return "8-10"

        # Early readers (Ages 6-7)
        early_reader_indicators = [
            "early reader", "beginning reader", "ages 5-8", "ages 6-9", "ages 5-7",
            "ages 6-8", "easy reader", "i can read", "step into reading", "ready to read",
            "level 1", "level 2", "level 3", "first grade", "second grade", "grade 1", "grade 2",
            "leveled reader", "beginning chapter"
        ]
        # Series names that are clearly early readers
        early_reader_series = [
            "frog and toad", "henry and mudge", "amelia bedelia", "biscuit",
            "little bear", "mercy watson", "fly guy", "owl diaries", "dragon masters",
            "nate the great", "elephant & piggie", "elephant and piggie", "mo willems"
        ]
        if any(term in subject_lower for term in early_reader_indicators):
            return "6-7"
        if any(series in title_lower for series in early_reader_series):
            return "6-7"
        if any(series in subject_lower for series in early_reader_series):
            return "6-7"
        # Medium-length books may be early readers
        if pages and 40 <= pages <= 80:
            return "6-7"

        # Picture books / Preschool (Ages 4-5)
        if any(term in subject_lower for term in ["picture book", "preschool", "ages 3-5", "ages 4-8", "ages 4-6", "ages 3-6"]):
            return "4-5"

        # Default based on page count
        if pages:
            if pages < 20:
                return "2-3"
            elif pages < 40:
                return "4-5"
            elif pages < 80:
                return "6-7"
            else:
                return "8-10"

        return "4-5"  # Default to preschool

    def _determine_moods(self, subjects: List[str], title: str) -> List[str]:
        """Determine moods from subjects and title"""
        moods = set()
        text = " ".join(subjects[:30] + [title]).lower()

        mood_keywords = {
            "calm": ["calm", "peaceful", "quiet", "gentle", "soothing", "bedtime", "sleep", "relax"],
            "silly": ["silly", "funny", "humor", "laugh", "comedy", "wacky", "crazy", "ridiculous"],
            "adventurous": ["adventure", "action", "exciting", "hero", "quest", "journey", "explore", "brave"],
            "emotional": ["emotion", "feeling", "sad", "touching", "heartwarming", "love", "loss", "grief"],
        }

        for mood, keywords in mood_keywords.items():
            if any(keyword in text for keyword in keywords):
                moods.add(mood)

        return list(moods) if moods else ["calm"]  # Default to calm

    def _extract_description(self, raw_data: Dict[str, Any]) -> Optional[str]:
        """Extract description from raw data"""
        # Try different fields
        desc = raw_data.get("description")
        if desc:
            if isinstance(desc, dict):
                return desc.get("value", "")
            return str(desc)

        # Fall back to first sentence of subjects
        subjects = raw_data.get("subject", [])
        if subjects:
            return f"A book about {', '.join(subjects[:3]).lower()}."

        return None

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_service: Optional[OpenLibraryService] = None


def get_open_library_service() -> OpenLibraryService:
    """Get Open Library service instance"""
    global _service
    if _service is None:
        _service = OpenLibraryService()
    return _service
