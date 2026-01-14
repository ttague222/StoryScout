"""
API routes package
"""

from .routes_recommendations import router as recommendations_router
from .routes_books import router as books_router

__all__ = [
    "recommendations_router",
    "books_router",
]
