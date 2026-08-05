from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import solve, truth_table, kmap, examples

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Production-grade API for Karnaugh Map (K-Map) solving, Boolean expression simplification, and visual grouping."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(solve.router, prefix=settings.API_PREFIX)
app.include_router(truth_table.router, prefix=settings.API_PREFIX)
app.include_router(kmap.router, prefix=settings.API_PREFIX)
app.include_router(examples.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected server error occurred: {str(exc)}"}
    )
