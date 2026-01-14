"""
Database package
"""

from .firebase import (
    initialize_firebase,
    get_db,
    get_book_by_id,
    get_books_by_ids,
    query_books,
    save_book,
    save_books_batch,
    get_book_count,
    BOOKS_COLLECTION,
)

__all__ = [
    "initialize_firebase",
    "get_db",
    "get_book_by_id",
    "get_books_by_ids",
    "query_books",
    "save_book",
    "save_books_batch",
    "get_book_count",
    "BOOKS_COLLECTION",
]
