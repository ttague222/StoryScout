"""
Books API Routes

Endpoints for book data operations
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from src.models import BookResponse
from src.services import get_recommendation_service
from src.db import get_book_by_id, query_books, get_book_count

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    """Get a single book by ID"""
    service = get_recommendation_service()
    book = await service.get_book_detail(book_id)

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    return book


@router.get("", response_model=List[dict])
async def search_books(
    q: Optional[str] = Query(None, description="Search query"),
    age_range: Optional[str] = Query(None, description="Filter by age range"),
    mood: Optional[str] = Query(None, description="Filter by mood"),
    theme: Optional[str] = Query(None, description="Filter by theme"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
):
    """
    Search/browse books with filters

    Returns raw book data for browsing
    """
    try:
        moods = [mood] if mood else None
        themes = [theme] if theme else None

        books = await query_books(
            age_range=age_range,
            moods=moods,
            themes=themes,
            limit=limit
        )

        # Format response
        return [
            {
                "id": book.get("id"),
                "title": book.get("title"),
                "author": book.get("author"),
                "cover_url": book.get("cover_url"),
                "age_range": book.get("age_range"),
                "reading_time_minutes": book.get("reading_time_minutes"),
                "themes": book.get("themes", []),
                "moods": book.get("moods", []),
            }
            for book in books
        ]
    except Exception as e:
        logger.error(f"Error searching books: {e}")
        raise HTTPException(status_code=500, detail="Failed to search books")


@router.get("/stats/count")
async def get_total_books():
    """Get total number of books in database"""
    try:
        count = await get_book_count()
        return {"total_books": count}
    except Exception as e:
        logger.error(f"Error getting book count: {e}")
        raise HTTPException(status_code=500, detail="Failed to get book count")
