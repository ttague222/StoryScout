"""
Book Ingestion Script

Fetches children's books from Open Library and populates Firestore
Run this to initially populate the database

Usage:
    python -m scripts.ingest_books
"""

import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from src.services.open_library import get_open_library_service
from src.db import save_books_batch, initialize_firebase, get_book_count

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Search queries for different categories of children's books
SEARCH_QUERIES = [
    # By age group
    {"query": "picture books", "subject": "juvenile fiction", "description": "Picture books"},
    {"query": "board books baby", "subject": "juvenile fiction", "description": "Board books"},
    {"query": "early reader", "subject": "juvenile fiction", "description": "Early readers"},
    {"query": "chapter books children", "subject": "juvenile fiction", "description": "Chapter books"},

    # By theme
    {"query": "bedtime stories children", "subject": "juvenile fiction", "description": "Bedtime stories"},
    {"query": "friendship children's books", "subject": "juvenile fiction", "description": "Friendship"},
    {"query": "animals children's picture", "subject": "juvenile fiction", "description": "Animals"},
    {"query": "adventure children", "subject": "juvenile fiction", "description": "Adventure"},
    {"query": "funny children's books", "subject": "juvenile fiction", "description": "Funny/Humor"},
    {"query": "emotions feelings children", "subject": "juvenile fiction", "description": "Emotions"},
    {"query": "kindness children", "subject": "juvenile fiction", "description": "Kindness"},
    {"query": "nature children's books", "subject": "juvenile fiction", "description": "Nature"},
    {"query": "family children's stories", "subject": "juvenile fiction", "description": "Family"},
    {"query": "learning children's educational", "subject": "juvenile fiction", "description": "Learning"},

    # Popular series/authors
    {"query": "Dr. Seuss", "subject": "juvenile fiction", "description": "Dr. Seuss"},
    {"query": "Eric Carle", "subject": "juvenile fiction", "description": "Eric Carle"},
    {"query": "Mo Willems", "subject": "juvenile fiction", "description": "Mo Willems"},
    {"query": "Pete the Cat", "subject": "juvenile fiction", "description": "Pete the Cat"},
    {"query": "Elephant Piggie", "subject": "juvenile fiction", "description": "Elephant & Piggie"},
    {"query": "Berenstain Bears", "subject": "juvenile fiction", "description": "Berenstain Bears"},
    {"query": "Magic Tree House", "subject": "juvenile fiction", "description": "Magic Tree House"},
    {"query": "Diary of a Wimpy Kid", "subject": "juvenile fiction", "description": "Wimpy Kid"},

    # Classic children's books
    {"query": "Goodnight Moon", "subject": "juvenile fiction", "description": "Classic - Goodnight Moon"},
    {"query": "Where the Wild Things Are", "subject": "juvenile fiction", "description": "Classic - Wild Things"},
    {"query": "Hungry Caterpillar", "subject": "juvenile fiction", "description": "Classic - Hungry Caterpillar"},
    {"query": "Charlotte's Web", "subject": "juvenile fiction", "description": "Classic - Charlotte's Web"},
    {"query": "Giving Tree", "subject": "juvenile fiction", "description": "Classic - Giving Tree"},

    # =====================================================
    # EARLY READERS (Ages 6-7) - Need more books!
    # =====================================================
    {"query": "beginning reader level 1", "subject": "juvenile fiction", "description": "Beginning Reader L1"},
    {"query": "beginning reader level 2", "subject": "juvenile fiction", "description": "Beginning Reader L2"},
    {"query": "I Can Read books", "subject": "juvenile fiction", "description": "I Can Read Series"},
    {"query": "Step Into Reading", "subject": "juvenile fiction", "description": "Step Into Reading"},
    {"query": "Ready to Read", "subject": "juvenile fiction", "description": "Ready to Read"},
    {"query": "first grade readers", "subject": "juvenile fiction", "description": "First Grade Readers"},
    {"query": "easy reader books", "subject": "juvenile fiction", "description": "Easy Readers"},
    {"query": "leveled readers ages 5-8", "subject": "juvenile fiction", "description": "Leveled Readers 5-8"},
    {"query": "Fly Guy", "subject": "juvenile fiction", "description": "Fly Guy Series"},
    {"query": "Henry and Mudge", "subject": "juvenile fiction", "description": "Henry and Mudge"},
    {"query": "Amelia Bedelia", "subject": "juvenile fiction", "description": "Amelia Bedelia"},
    {"query": "Frog and Toad", "subject": "juvenile fiction", "description": "Frog and Toad"},
    {"query": "Little Bear", "subject": "juvenile fiction", "description": "Little Bear"},
    {"query": "Biscuit dog", "subject": "juvenile fiction", "description": "Biscuit Series"},
    {"query": "Mercy Watson", "subject": "juvenile fiction", "description": "Mercy Watson"},
    {"query": "Owl Diaries", "subject": "juvenile fiction", "description": "Owl Diaries"},
    {"query": "Dragon Masters", "subject": "juvenile fiction", "description": "Dragon Masters"},
    {"query": "early chapter books ages 6-9", "subject": "juvenile fiction", "description": "Early Chapter 6-9"},
    {"query": "Nate the Great", "subject": "juvenile fiction", "description": "Nate the Great"},
    {"query": "Cam Jansen", "subject": "juvenile fiction", "description": "Cam Jansen"},

    # =====================================================
    # CHAPTER BOOKS (Ages 8-10) - Need more books!
    # =====================================================
    {"query": "chapter books ages 8-12", "subject": "juvenile fiction", "description": "Chapter Books 8-12"},
    {"query": "middle grade fiction", "subject": "juvenile fiction", "description": "Middle Grade Fiction"},
    {"query": "ages 9-12 fiction", "subject": "juvenile fiction", "description": "Ages 9-12 Fiction"},
    {"query": "elementary school chapter books", "subject": "juvenile fiction", "description": "Elementary Chapter"},
    {"query": "third grade chapter books", "subject": "juvenile fiction", "description": "Third Grade Books"},
    {"query": "fourth grade reading", "subject": "juvenile fiction", "description": "Fourth Grade Books"},
    {"query": "Junie B Jones", "subject": "juvenile fiction", "description": "Junie B Jones"},
    {"query": "Geronimo Stilton", "subject": "juvenile fiction", "description": "Geronimo Stilton"},
    {"query": "Dog Man", "subject": "juvenile fiction", "description": "Dog Man"},
    {"query": "Captain Underpants", "subject": "juvenile fiction", "description": "Captain Underpants"},
    {"query": "Dogman and Cat Kid", "subject": "juvenile fiction", "description": "Dogman Cat Kid"},
    {"query": "Big Nate", "subject": "juvenile fiction", "description": "Big Nate"},
    {"query": "Dork Diaries", "subject": "juvenile fiction", "description": "Dork Diaries"},
    {"query": "Bad Guys series", "subject": "juvenile fiction", "description": "Bad Guys"},
    {"query": "Goosebumps", "subject": "juvenile fiction", "description": "Goosebumps"},
    {"query": "Percy Jackson", "subject": "juvenile fiction", "description": "Percy Jackson"},
    {"query": "Ramona Quimby", "subject": "juvenile fiction", "description": "Ramona Quimby"},
    {"query": "Judy Moody", "subject": "juvenile fiction", "description": "Judy Moody"},
    {"query": "Ivy and Bean", "subject": "juvenile fiction", "description": "Ivy and Bean"},
    {"query": "Stink Moody", "subject": "juvenile fiction", "description": "Stink Series"},
    {"query": "Horrible Harry", "subject": "juvenile fiction", "description": "Horrible Harry"},
    {"query": "A to Z Mysteries", "subject": "juvenile fiction", "description": "A to Z Mysteries"},
    {"query": "Clementine series", "subject": "juvenile fiction", "description": "Clementine"},
    {"query": "Wayside School", "subject": "juvenile fiction", "description": "Wayside School"},
    {"query": "Flat Stanley", "subject": "juvenile fiction", "description": "Flat Stanley"},
]


async def ingest_books():
    """Main ingestion function"""
    logger.info("Starting book ingestion...")

    # Initialize Firebase
    initialize_firebase()
    initial_count = await get_book_count()
    logger.info(f"Current book count: {initial_count}")

    # Get Open Library service
    ol_service = get_open_library_service()

    all_books = []
    seen_titles = set()  # Avoid duplicates

    for search_config in SEARCH_QUERIES:
        query = search_config["query"]
        subject = search_config.get("subject")
        description = search_config["description"]

        logger.info(f"Searching: {description} ({query})...")

        try:
            results = await ol_service.search_books(
                query=query,
                subject=subject,
                limit=30
            )

            for raw_book in results:
                # Skip if we've seen this title
                title = raw_book.get("title", "").lower().strip()
                if title in seen_titles:
                    continue

                # Skip if no cover
                if not raw_book.get("cover_i"):
                    continue

                seen_titles.add(title)

                # Parse into our format
                book_data = ol_service.parse_book_data(raw_book)

                # Generate ID from ISBN or Open Library key
                book_id = book_data.get("isbn") or book_data.get("open_library_key", "").replace("/works/", "")
                if book_id:
                    book_data["id"] = book_id
                    all_books.append(book_data)

            logger.info(f"  Found {len(results)} books, {len(all_books)} total unique")

            # Small delay to be nice to the API
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"Error searching '{query}': {e}")
            continue

    logger.info(f"Total unique books collected: {len(all_books)}")

    if all_books:
        # Save to Firestore
        logger.info("Saving books to Firestore...")
        saved_count = await save_books_batch(all_books)
        logger.info(f"Saved {saved_count} books to Firestore")

    # Final count
    final_count = await get_book_count()
    logger.info(f"Final book count: {final_count} (added {final_count - initial_count} new books)")

    # Close HTTP client
    await ol_service.close()

    logger.info("Book ingestion complete!")


async def ingest_curated_books():
    """
    Ingest a curated list of high-quality children's books

    These are hand-picked popular books with good metadata
    """
    logger.info("Ingesting curated book list...")

    initialize_firebase()

    # Curated list of ISBNs for popular children's books
    CURATED_ISBNS = [
        # Picture Books (Ages 2-5)
        "9780064430173",  # Goodnight Moon
        "9780060254926",  # Where the Wild Things Are
        "9780399226908",  # Very Hungry Caterpillar
        "9780399215926",  # Corduroy
        "9780060256654",  # Harold and the Purple Crayon
        "9780064431781",  # Frog and Toad Are Friends
        "9780064430050",  # Amelia Bedelia
        "9780399208539",  # If You Give a Mouse a Cookie
        "9780064432566",  # Strega Nona
        "9780140501827",  # Madeline

        # Board Books (Ages 0-3)
        "9780399226915",  # Brown Bear, Brown Bear
        "9780694003617",  # Pat the Bunny
        "9780694014507",  # Moo Baa La La La
        "9780399242601",  # Chicka Chicka Boom Boom
        "9780399231018",  # Dear Zoo

        # Early Readers (Ages 5-7)
        "9780394800011",  # Cat in the Hat
        "9780394800790",  # Green Eggs and Ham
        "9780394800165",  # One Fish Two Fish
        "9780394800134",  # Hop on Pop
        "9780060229528",  # If You Give a Pig a Pancake

        # Chapter Books (Ages 7-10)
        "9780064400558",  # Charlotte's Web
        "9780064410939",  # Ramona the Pest
        "9780064401845",  # Tales of a Fourth Grade Nothing
        "9780064402507",  # James and the Giant Peach
        "9780439023481",  # Diary of a Wimpy Kid
    ]

    ol_service = get_open_library_service()
    books = []

    for isbn in CURATED_ISBNS:
        logger.info(f"Fetching ISBN: {isbn}")
        try:
            results = await ol_service.search_books(query=f"isbn:{isbn}", limit=1)
            if results:
                book_data = ol_service.parse_book_data(results[0])
                book_data["id"] = isbn
                book_data["is_curated"] = True
                book_data["popularity_score"] = 5.0  # Boost curated books
                books.append(book_data)
            await asyncio.sleep(0.3)
        except Exception as e:
            logger.error(f"Error fetching {isbn}: {e}")

    if books:
        saved_count = await save_books_batch(books)
        logger.info(f"Saved {saved_count} curated books")

    await ol_service.close()


if __name__ == "__main__":
    # Run ingestion
    asyncio.run(ingest_books())
