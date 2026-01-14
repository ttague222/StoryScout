"""
Recommendation API Routes

Endpoints for getting book recommendations
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from src.models import (
    RecommendationRequest,
    RecommendationResponse,
    BookResponse,
    Mood,
    Theme,
    TimeOption,
    AgeRange,
)
from src.services import get_recommendation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized book recommendations

    Based on:
    - Mood: How is the child feeling? (calm, silly, adventurous, emotional)
    - Time: How much time do you have? (quick, medium, long)
    - Age Range: Child's age range
    - Themes: Optional theme preferences
    """
    try:
        service = get_recommendation_service()
        result = await service.get_recommendations(request)
        return result
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")


@router.get("/quick", response_model=RecommendationResponse)
async def get_quick_recommendations(
    mood: Mood = Query(..., description="Current mood"),
    time: TimeOption = Query(..., description="Time available"),
    age_range: AgeRange = Query(..., description="Child's age range"),
    themes: Optional[List[Theme]] = Query(None, description="Preferred themes"),
):
    """
    Quick recommendation endpoint using query parameters

    Simpler alternative to POST endpoint
    """
    request = RecommendationRequest(
        mood=mood,
        time=time,
        age_range=age_range,
        themes=themes or [],
    )

    try:
        service = get_recommendation_service()
        result = await service.get_recommendations(request)
        return result
    except Exception as e:
        logger.error(f"Error getting quick recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")


@router.get("/moods", response_model=List[dict])
async def get_mood_options():
    """Get available mood options with descriptions"""
    return [
        {
            "id": "calm",
            "label": "Calm",
            "emoji": "😌",
            "description": "Peaceful, soothing stories",
        },
        {
            "id": "silly",
            "label": "Silly",
            "emoji": "🤪",
            "description": "Fun, giggly adventures",
        },
        {
            "id": "adventurous",
            "label": "Adventurous",
            "emoji": "🚀",
            "description": "Exciting, action-packed tales",
        },
        {
            "id": "emotional",
            "label": "Emotional",
            "emoji": "🥹",
            "description": "Stories about feelings",
        },
    ]


@router.get("/times", response_model=List[dict])
async def get_time_options():
    """Get available time options"""
    return [
        {
            "id": "quick",
            "label": "5 minutes",
            "emoji": "⚡",
            "description": "Quick bedtime read",
        },
        {
            "id": "medium",
            "label": "10-15 minutes",
            "emoji": "📖",
            "description": "Standard story time",
        },
        {
            "id": "long",
            "label": "Longer read",
            "emoji": "📚",
            "description": "We have time to spare",
        },
    ]
