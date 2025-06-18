# app/__init__.py
"""
Root package of *English-AI-Trainer*.

Chỉ export hàm `create_app` để người dùng có thể:
>>> from app import create_app
"""

from .main import create_app          # noqa: F401 – re-export
