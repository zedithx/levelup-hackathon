from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.db.session import get_db

router = APIRouter(prefix="/health", tags=["health"])
settings = get_settings()


@router.get("")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.get("/db")
def db_health(db: Session = Depends(get_db)) -> dict[str, str]:
    if not settings.db_healthcheck_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found."
        )

    try:
        db.execute(text("SELECT 1"))
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not reachable."
        ) from exc

    return {
        "status": "ok",
        "database": "connected",
        "timestamp": datetime.now(UTC).isoformat()
    }
