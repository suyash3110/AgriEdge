"""Internal inference boundary. No unvalidated model is represented as trained."""
import os
from datetime import datetime, timedelta
from typing import Literal
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AgriEdge model service", version="0.1.0")

class SafeWindow(BaseModel):
    usable_until: datetime | None = None
    condition: str | None = None
    collection_hours: float = Field(ge=0)
    travel_hours: float = Field(ge=0)
    candidate_dates: list[datetime] = Field(max_length=100)

def safe_window(data: SafeWindow):
    if data.usable_until is None or not data.condition:
        return {"allowed": [], "reason": "MISSING_CONDITIONS"}
    buffer = timedelta(hours=data.collection_hours + data.travel_hours)
    allowed = [d.isoformat() for d in data.candidate_dates if d + buffer <= data.usable_until]
    return {"allowed": allowed, "reason": "SAFE_WINDOW" if allowed else "SPOILAGE_GUARD"}

def authorized(token: str | None):
    expected = os.getenv("ML_SERVICE_TOKEN")
    import hmac
    if not expected or not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/health")
def health():
    return {"status": "ok", "forecast": "unsupported", "quality": "unsupported"}

@app.post("/safe-window")
def window(data: SafeWindow, x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    return safe_window(data)

@app.get("/forecast")
def forecast(crop: str, market: str, x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    return {"status": "unsupported", "code": "MODEL_UNSUPPORTED", "crop": crop, "market": market,
            "reason": "No licensed, evaluated crop-market model has been deployed."}

@app.get("/quality")
def quality(crop: str, x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    return {"status": "unsupported", "code": "MODEL_UNSUPPORTED", "crop": crop,
            "next_action": "Request manual FPO assessment", "limitations": ["Image-only moisture and chemical claims are unsupported."]}

