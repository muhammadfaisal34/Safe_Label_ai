import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parents[1]
_workspace_root = _backend_dir.parent.parent

for _path in (str(_workspace_root), str(_backend_dir)):
    if _path not in sys.path:
        sys.path.insert(0, _path)

try:
    from app.backend.main import app
except (ModuleNotFoundError, ImportError):
    import main
    app = main.app

__all__ = ["app"]




