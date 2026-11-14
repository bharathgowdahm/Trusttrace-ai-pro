
from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(
    title="TrustLens AI",
    description=(
        "Second-hand smartphone authenticity "
        "and buyer-risk investigation API."
    ),
    version="0.1.0",
)


@app.get("/")
async def home():
    return {
        "project": "TrustLens AI",
        "message": "Welcome to TrustLens AI",
        "version": "0.1.0",
        "status": "operational",
        "category": "smartphones",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "TrustLens API",
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }


@app.get("/api/v1")
async def api_info():
    return {
        "name": "TrustLens AI",
        "api_version": "v1",
        "modules": [
            "vision_check",
            "serial_check",
            "price_intel",
            "scam_shield",
            "seller_trust",
            "trust_score",
            "evidence_report",
        ],
        "implemented": False,
        "message": "Intelligence modules are under development."
    }
