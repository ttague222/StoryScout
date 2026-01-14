"""
Book Data Models

Defines the structure for books in StoryScout
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class AgeRange(str, Enum):
    """Age ranges for book recommendations"""
    TODDLER = "2-3"
    PRESCHOOL = "4-5"
    EARLY_READER = "6-7"
    MIDDLE_GRADE = "8-10"


class ReadingType(str, Enum):
    """How the book will be read"""
    READ_ALOUD = "read-aloud"
    INDEPENDENT = "independent"
    BOTH = "both"


class Mood(str, Enum):
    """Book moods for recommendations"""
    CALM = "calm"
    SILLY = "silly"
    ADVENTUROUS = "adventurous"
    EMOTIONAL = "emotional"


class Theme(str, Enum):
    """Book themes/topics"""
    KINDNESS = "kindness"
    ADVENTURE = "adventure"
    BEDTIME = "bedtime"
    EMOTIONS = "emotions"
    ANIMALS = "animals"
    LEARNING = "learning"
    HUMOR = "humor"
    FRIENDSHIP = "friendship"
    NATURE = "nature"
    FAMILY = "family"


class TimeOption(str, Enum):
    """Reading time available"""
    QUICK = "quick"      # ~5 minutes
    MEDIUM = "medium"    # ~10-15 minutes
    LONG = "long"        # ~20+ minutes


class Book(BaseModel):
    """Core book model"""
    id: str = Field(..., description="Unique book identifier")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Author name(s)")

    # Cover image
    cover_url: Optional[str] = Field(None, description="URL to book cover image")
    cover_id: Optional[str] = Field(None, description="Open Library cover ID")

    # Classification
    age_range: AgeRange = Field(..., description="Recommended age range")
    reading_time_minutes: int = Field(..., description="Estimated reading time in minutes")
    themes: List[Theme] = Field(default_factory=list, description="Book themes")
    moods: List[Mood] = Field(default_factory=list, description="Suitable moods")
    reading_type: ReadingType = Field(default=ReadingType.BOTH, description="Reading type")

    # Content
    description: Optional[str] = Field(None, description="Book description/summary")
    page_count: Optional[int] = Field(None, description="Number of pages")

    # External IDs
    isbn: Optional[str] = Field(None, description="ISBN-13 or ISBN-10")
    open_library_key: Optional[str] = Field(None, description="Open Library work key")

    # Metadata
    publisher: Optional[str] = Field(None, description="Publisher name")
    publish_year: Optional[int] = Field(None, description="Year published")

    # Internal
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="Whether book is available for recommendations")

    # Quality/ranking
    popularity_score: float = Field(default=0.0, description="Popularity score for ranking")

    class Config:
        use_enum_values = True


class BookCreate(BaseModel):
    """Model for creating a new book"""
    title: str
    author: str
    cover_url: Optional[str] = None
    cover_id: Optional[str] = None
    age_range: AgeRange
    reading_time_minutes: int
    themes: List[Theme] = []
    moods: List[Mood] = []
    reading_type: ReadingType = ReadingType.BOTH
    description: Optional[str] = None
    page_count: Optional[int] = None
    isbn: Optional[str] = None
    open_library_key: Optional[str] = None
    publisher: Optional[str] = None
    publish_year: Optional[int] = None

    class Config:
        use_enum_values = True


class BookResponse(BaseModel):
    """Book response with recommendation context"""
    id: str
    title: str
    author: str
    cover_url: Optional[str]
    age_range: str
    reading_time: str  # Formatted string like "5 min"
    themes: List[str]
    description: Optional[str]
    why_it_fits: str  # Generated explanation for why this book was recommended

    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    """Request for book recommendations"""
    mood: Mood
    time: TimeOption
    age_range: AgeRange
    reading_type: Optional[ReadingType] = None
    themes: List[Theme] = []
    exclude_book_ids: List[str] = []  # Books to exclude (already seen/saved)

    class Config:
        use_enum_values = True


class RecommendationResponse(BaseModel):
    """Response containing book recommendations"""
    books: List[BookResponse]
    total_matches: int
    request_id: str  # For tracking/feedback
