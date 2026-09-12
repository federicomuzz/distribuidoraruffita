import os

from sqlmodel import create_engine

DB_PATH = os.getenv("DB_PATH") or (
    "/data/distri.db" if os.path.isdir("/data") else "distri.db"
)
engine = create_engine(
    f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False}
)
