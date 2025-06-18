# app/presentation/routers/__init__.py
"""
Expose tất cả routers để main.py import gọn:
    from app.presentation.routers import home, api_voice, auth, ...
"""

from .home              import router as home         # noqa: F401
from .api_voice         import router as api_voice    # noqa: F401
from .auth              import router as auth         # noqa: F401
from .exercise          import router as exercise     # noqa: F401
from .page              import router as page         # noqa: F401
from .profile_api       import router as profile_api       # noqa: F401
from .api_keywords      import router as api_keywords      # noqa: F401
# thêm router khác nếu có…

__all__ = ["home", "api_voice", "auth", "exercise" ,"page","profile_api"]

