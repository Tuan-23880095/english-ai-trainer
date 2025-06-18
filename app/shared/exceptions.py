# app/shared/exceptions.py
class AppError(Exception):
    """Lỗi nghiệp vụ (domain/business error) – khi raise sẽ chuyển thành 400/422."""
    def __init__(self, message: str, *, code: int | None = None):
        self.message = message
        self.code = code or 400
        super().__init__(message)

    def __str__(self) -> str:            # để str(e) == message
        return self.message


class UnauthorizedError(AppError):
    def __init__(self, message="Unauthorized"):
        super().__init__(message, code=401)

