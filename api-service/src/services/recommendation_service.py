"""
Recommendation Service

Core recommendation engine for StoryScout
Matches books to user preferences using scoring algorithm
"""

import logging
import random
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.models import (
    RecommendationRequest,
    RecommendationResponse,
    BookResponse,
    Mood,
    Theme,
    TimeOption,
    AgeRange,
)
from src.db import query_books, get_book_by_id

logger = logging.getLogger(__name__)

# Time option to max minutes mapping
TIME_TO_MINUTES = {
    TimeOption.QUICK: 7,      # Up to 7 minutes
    TimeOption.MEDIUM: 18,    # Up to 18 minutes
    TimeOption.LONG: 60,      # Up to 60 minutes
}

# Mood descriptions for "why it fits" generation
MOOD_DESCRIPTIONS = {
    Mood.CALM: [
        "Its gentle, soothing narrative is perfect for winding down",
        "The peaceful story creates a calming atmosphere",
        "Soft illustrations and quiet moments make this ideal for relaxation",
    ],
    Mood.SILLY: [
        "Guaranteed giggles with its playful humor",
        "The absurd situations will have everyone laughing",
        "Perfect for when you need some silly fun",
    ],
    Mood.ADVENTUROUS: [
        "An exciting journey that sparks imagination",
        "Action-packed scenes keep young readers engaged",
        "The thrilling plot will satisfy their sense of adventure",
    ],
    Mood.EMOTIONAL: [
        "A touching story that helps process big feelings",
        "Beautiful exploration of emotions children relate to",
        "Opens doors for meaningful conversations about feelings",
    ],
}

# Theme descriptions
THEME_DESCRIPTIONS = {
    Theme.KINDNESS: "teaches important lessons about kindness",
    Theme.ADVENTURE: "takes readers on an exciting journey",
    Theme.BEDTIME: "perfect for the bedtime routine",
    Theme.EMOTIONS: "helps children understand their feelings",
    Theme.ANIMALS: "features beloved animal characters",
    Theme.LEARNING: "makes learning fun and engaging",
    Theme.HUMOR: "brings joy and laughter",
    Theme.FRIENDSHIP: "celebrates the power of friendship",
    Theme.NATURE: "connects children with the natural world",
    Theme.FAMILY: "celebrates family bonds",
}


class RecommendationService:
    """Service for generating book recommendations"""

    async def get_recommendations(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """
        Get personalized book recommendations

        Args:
            request: Recommendation request with preferences

        Returns:
            List of recommended books with explanations
        """
        request_id = str(uuid.uuid4())[:8]
        logger.info(f"[{request_id}] Getting recommendations: mood={request.mood}, time={request.time}, age={request.age_range}")

        # Convert time option to max minutes
        max_minutes = TIME_TO_MINUTES.get(request.time, 15)

        # Query books from database
        books = await query_books(
            age_range=request.age_range,
            moods=[request.mood],
            max_reading_time=max_minutes,
            exclude_ids=request.exclude_book_ids,
            limit=50
        )

        logger.info(f"[{request_id}] Found {len(books)} potential books")

        if not books:
            # Return empty response
            return RecommendationResponse(
                books=[],
                total_matches=0,
                request_id=request_id
            )

        # Score and rank books
        scored_books = self._score_books(books, request)

        # Sort by score (descending)
        scored_books.sort(key=lambda x: x["score"], reverse=True)

        # Take top 3-5 books
        num_results = min(len(scored_books), random.randint(3, 5))
        top_books = scored_books[:num_results]

        # Convert to response format
        book_responses = [
            self._to_book_response(book, request)
            for book in top_books
        ]

        logger.info(f"[{request_id}] Returning {len(book_responses)} recommendations")

        return RecommendationResponse(
            books=book_responses,
            total_matches=len(books),
            request_id=request_id
        )

    def _score_books(
        self,
        books: List[Dict[str, Any]],
        request: RecommendationRequest
    ) -> List[Dict[str, Any]]:
        """
        Score books based on how well they match the request

        Scoring factors:
        - Mood match (most important)
        - Theme overlap
        - Reading time fit
        - Popularity bonus
        """
        scored = []

        for book in books:
            score = 0.0

            # Mood match (0-40 points)
            book_moods = book.get("moods", [])
            if request.mood in book_moods:
                score += 40
            elif book_moods:
                # Partial credit for related moods
                score += 10

            # Theme overlap (0-30 points)
            if request.themes:
                book_themes = set(book.get("themes", []))
                requested_themes = set(request.themes)
                overlap = len(book_themes & requested_themes)
                if overlap > 0:
                    score += min(30, overlap * 15)

            # Reading time fit (0-20 points)
            max_minutes = TIME_TO_MINUTES.get(request.time, 15)
            book_time = book.get("reading_time_minutes", 10)

            if book_time <= max_minutes:
                # Prefer books that use most of the available time
                time_utilization = book_time / max_minutes
                score += 20 * time_utilization

            # Popularity bonus (0-10 points)
            popularity = book.get("popularity_score", 0)
            if popularity > 0:
                score += min(10, popularity * 2)

            # Add some randomness to avoid same recommendations every time
            score += random.uniform(0, 5)

            book["score"] = score
            scored.append(book)

        return scored

    def _to_book_response(
        self,
        book: Dict[str, Any],
        request: RecommendationRequest
    ) -> BookResponse:
        """Convert book data to response format with generated explanation"""

        # Generate "why it fits" explanation
        why_it_fits = self._generate_why_it_fits(book, request)

        # Format reading time
        reading_time = book.get("reading_time_minutes", 10)
        if reading_time <= 5:
            reading_time_str = "5 min"
        elif reading_time <= 10:
            reading_time_str = "10 min"
        elif reading_time <= 15:
            reading_time_str = "15 min"
        else:
            reading_time_str = f"{reading_time} min"

        return BookResponse(
            id=book.get("id", "unknown"),
            title=book.get("title", "Unknown Title"),
            author=book.get("author", "Unknown Author"),
            cover_url=book.get("cover_url"),
            age_range=book.get("age_range", "4-5"),
            reading_time=reading_time_str,
            themes=book.get("themes", []),
            description=book.get("description"),
            why_it_fits=why_it_fits
        )

    def _generate_why_it_fits(
        self,
        book: Dict[str, Any],
        request: RecommendationRequest
    ) -> str:
        """Generate a personalized explanation for why this book fits"""

        parts = []

        # Start with mood-based reason
        mood_reasons = MOOD_DESCRIPTIONS.get(request.mood, [])
        if mood_reasons:
            parts.append(random.choice(mood_reasons))

        # Add theme-specific reason if themes overlap
        book_themes = book.get("themes", [])
        matching_themes = [t for t in request.themes if t in book_themes]

        if matching_themes:
            theme = matching_themes[0]
            theme_desc = THEME_DESCRIPTIONS.get(theme, "")
            if theme_desc:
                parts.append(f"It {theme_desc}")

        # If no parts yet, create generic reason
        if not parts:
            parts.append(f"A wonderful choice for {request.age_range} year olds")

        # Join parts
        result = ". ".join(parts)
        if not result.endswith("."):
            result += "."

        return result

    async def get_book_detail(self, book_id: str) -> Optional[BookResponse]:
        """Get detailed book information"""
        book = await get_book_by_id(book_id)

        if not book:
            return None

        # Format reading time
        reading_time = book.get("reading_time_minutes", 10)
        reading_time_str = f"{reading_time} min"

        return BookResponse(
            id=book.get("id", book_id),
            title=book.get("title", "Unknown Title"),
            author=book.get("author", "Unknown Author"),
            cover_url=book.get("cover_url"),
            age_range=book.get("age_range", "4-5"),
            reading_time=reading_time_str,
            themes=book.get("themes", []),
            description=book.get("description"),
            why_it_fits=book.get("description") or "A great choice for young readers."
        )


# Singleton instance
_service: Optional[RecommendationService] = None


def get_recommendation_service() -> RecommendationService:
    """Get recommendation service instance"""
    global _service
    if _service is None:
        _service = RecommendationService()
    return _service
