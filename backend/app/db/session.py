from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.core.config import get_settings

engine = None
SessionLocal = None


def _get_engine():
    global engine, SessionLocal
    settings = get_settings()

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set. Add it to your .env or .env.local file.")

    if engine is None:
        engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    return engine


def get_db() -> Generator[Session, None, None]:
    _get_engine()

    if SessionLocal is None:
        raise RuntimeError("Session factory is not initialized.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

