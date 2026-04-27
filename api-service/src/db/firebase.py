"""
Firebase/Firestore Database Connection

Handles connection to Firestore for book storage
"""

import os
import logging
import random
from typing import Optional
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

# Firestore collection names
BOOKS_COLLECTION = "books"
USER_STATS_COLLECTION = "userStats"
FEEDBACK_COLLECTION = "feedback"

# Global Firestore client
_db: Optional[firestore.Client] = None


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK"""
    global _db

    if _db is not None:
        return

    try:
        # Check if already initialized
        firebase_admin.get_app()
        logger.info("Firebase already initialized")
    except ValueError:
        # Initialize Firebase
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info(f"Firebase initialized with credentials from {cred_path}")
        else:
            # Use default credentials (for Cloud Run)
            firebase_admin.initialize_app()
            logger.info("Firebase initialized with default credentials")

    _db = firestore.client()
    logger.info("Firestore client created")


def get_db() -> firestore.Client:
    """Get Firestore client instance"""
    global _db

    if _db is None:
        initialize_firebase()

    return _db


async def get_book_by_id(book_id: str) -> Optional[dict]:
    """Get a single book by ID"""
    db = get_db()
    doc = db.collection(BOOKS_COLLECTION).document(book_id).get()

    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data

    return None


async def get_books_by_ids(book_ids: list) -> list:
    """Get multiple books by IDs"""
    if not book_ids:
        return []

    db = get_db()
    books = []

    # Firestore limits 'in' queries to 30 items
    for i in range(0, len(book_ids), 30):
        batch_ids = book_ids[i:i + 30]
        docs = db.collection(BOOKS_COLLECTION).where("__name__", "in", batch_ids).stream()

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            books.append(data)

    return books


def _parse_age_range(age_range: str) -> tuple:
    """Parse age range string like '4-5' into (min, max) tuple"""
    try:
        parts = age_range.split("-")
        if len(parts) == 2:
            return (int(parts[0]), int(parts[1]))
        return (0, 99)
    except:
        return (0, 99)


def _age_ranges_overlap(book_range: str, user_range: str) -> bool:
    """Check if book age range overlaps with user's selected age range"""
    book_min, book_max = _parse_age_range(book_range)
    user_min, user_max = _parse_age_range(user_range)

    # Ranges overlap if one starts before the other ends
    return book_min <= user_max and user_min <= book_max


async def query_books(
    age_range: Optional[str] = None,
    moods: Optional[list] = None,
    themes: Optional[list] = None,
    max_reading_time: Optional[int] = None,
    exclude_ids: Optional[list] = None,
    limit: int = 50
) -> list:
    """
    Query books with filters

    Note: Firestore has limitations on compound queries.
    We do basic filtering here and more complex filtering in Python.
    """
    db = get_db()
    query = db.collection(BOOKS_COLLECTION).where("is_active", "==", True)

    # Note: We don't filter age_range in Firestore because we need overlap matching
    # Instead we fetch more books and filter in Python

    # Limit results - get more to account for Python filtering
    query = query.limit(limit * 4)

    docs = query.stream()
    all_matching_books = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id

        # Skip excluded books
        if exclude_ids and doc.id in exclude_ids:
            continue

        # Filter by age range (allow overlapping ranges)
        if age_range:
            book_age_range = data.get("age_range", "")
            if book_age_range and not _age_ranges_overlap(book_age_range, age_range):
                continue

        # Filter by mood (Firestore can't do array-contains with multiple values)
        if moods:
            book_moods = data.get("moods", [])
            if not any(m in book_moods for m in moods):
                continue

        # Filter by reading time
        if max_reading_time:
            book_time = data.get("reading_time_minutes", 0)
            if book_time > max_reading_time:
                continue

        all_matching_books.append(data)

    # Shuffle to provide variety in recommendations
    random.shuffle(all_matching_books)

    # Return up to limit books
    return all_matching_books[:limit]


async def save_book(book_data: dict) -> str:
    """Save a book to Firestore"""
    db = get_db()

    # Use ISBN or generate ID
    book_id = book_data.get("isbn") or book_data.get("open_library_key") or None

    if book_id:
        # Check if exists
        existing = db.collection(BOOKS_COLLECTION).document(book_id).get()
        if existing.exists:
            # Update existing
            db.collection(BOOKS_COLLECTION).document(book_id).update(book_data)
            return book_id

    # Create new
    if book_id:
        db.collection(BOOKS_COLLECTION).document(book_id).set(book_data)
        return book_id
    else:
        doc_ref = db.collection(BOOKS_COLLECTION).add(book_data)
        return doc_ref[1].id


async def save_books_batch(books: list) -> int:
    """Save multiple books in a batch"""
    db = get_db()
    batch = db.batch()
    count = 0

    for book_data in books:
        book_id = book_data.get("id") or book_data.get("isbn") or book_data.get("open_library_key")

        if book_id:
            ref = db.collection(BOOKS_COLLECTION).document(book_id)
        else:
            ref = db.collection(BOOKS_COLLECTION).document()

        batch.set(ref, book_data, merge=True)
        count += 1

        # Firestore batch limit is 500
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()

    # Commit remaining
    if count % 500 != 0:
        batch.commit()

    return count


async def get_book_count() -> int:
    """Get total number of active books"""
    db = get_db()
    # Note: This is expensive for large collections
    # Consider using a counter document for production
    docs = db.collection(BOOKS_COLLECTION).where("is_active", "==", True).stream()
    return sum(1 for _ in docs)
