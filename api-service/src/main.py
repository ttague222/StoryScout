"""
StoryScout API Service

Main FastAPI application entry point
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.db import initialize_firebase
from src.api import recommendations_router, books_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting StoryScout API...")
    initialize_firebase()
    logger.info("Firebase initialized")
    yield
    # Shutdown
    logger.info("Shutting down StoryScout API...")


# Create FastAPI app
app = FastAPI(
    title="StoryScout API",
    description="Intent-based children's book recommendations for parents",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

# Add default development origins
if os.getenv("ENVIRONMENT", "development") == "development":
    cors_origins.extend([
        "http://localhost:19006",  # Expo web
        "http://localhost:8081",   # Metro bundler
        "http://localhost:3000",   # React dev server
        "exp://localhost:8081",    # Expo Go
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(recommendations_router)
app.include_router(books_router)


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "StoryScout API",
        "version": "1.0.0",
        "description": "Intent-based children's book recommendations",
        "endpoints": {
            "recommendations": "/recommendations",
            "books": "/books",
            "health": "/health",
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "storyscout-api",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8080))

    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )
