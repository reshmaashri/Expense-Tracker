import sys
from pathlib import Path

# Ensure backend root is always on sys.path regardless of execution working directory
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pymongo.errors import PyMongoError

from app.config import settings
from app.database import init_database, close_database, check_database_health
from app.routers import auth_router, expenses_router, analytics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("expense-tracker")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    # Initialize MongoDB connection & indexes
    is_connected = init_database()
    if is_connected:
        logger.info("Database connection established successfully.")
    else:
        logger.warning("Database connection is currently degraded. Server started in resilient mode.")
    yield
    # Shutdown
    logger.info("Shutting down application...")
    close_database()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="REST API for Cloud-Based Expense Tracker with MongoDB Atlas",
    lifespan=lifespan
)

# Configure CORS
origins = settings.cors_origins_list
has_wildcard = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else origins,
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(analytics_router)


# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors cleanly."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append({"field": loc, "message": msg})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request validation failed",
            "errors": errors
        }
    )


@app.exception_handler(PyMongoError)
async def mongo_exception_handler(request: Request, exc: PyMongoError):
    """Handle database operational errors gracefully."""
    logger.error(f"Database error during request {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database service is temporarily unavailable. Please try again shortly."
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exceptions."""
    logger.error(f"Unhandled exception during request {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected server error occurred."
        }
    )


@app.get("/")
def read_root():
    """Root status endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint returning backend status and MongoDB connection status.
    Returns status: 'ok' if healthy, or 'degraded' if MongoDB is unavailable.
    """
    db_health = check_database_health()
    if db_health.get("status") == "connected":
        return {
            "status": "ok",
            "database": "connected",
            "database_name": db_health.get("database")
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_200_OK,  # Keep 200 OK so health probes recognize backend is alive
            content={
                "status": "degraded",
                "database": "disconnected",
                "database_name": db_health.get("database"),
                "detail": db_health.get("error", "Database connection unreachable")
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
