# app/shared/__init__.py
from .exceptions import AppError, UnauthorizedError  # 👈 thêm dòng này
from . import security                               # giữ nguyên các import cũ
