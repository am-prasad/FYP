import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

for _p in (str(PROJECT_ROOT), str(BACKEND_DIR)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Resolve directories with fallback to backend dir if project root lacks them
CONFIG_DIR = PROJECT_ROOT / "config" if (PROJECT_ROOT / "config").is_dir() else (BACKEND_DIR / "config")
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts" if (PROJECT_ROOT / "artifacts").is_dir() else (BACKEND_DIR / "artifacts")
DATA_DIR = PROJECT_ROOT / "data" if (PROJECT_ROOT / "data").is_dir() else (BACKEND_DIR / "data")

DB_FILE = PROJECT_ROOT / "submissions.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]


