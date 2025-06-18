 # app/repository/__init__.py
"""
Repository Layer (Data Access) — abstract + concrete impl.
"""

from .abc import (           # re-export interface
    IUserRepo, IExerciseRepo, IResultRepo,
)

# Concrete implementations (prod/dev)
from .sqlite import (        # noqa: F401
    UserRepoSQL, ExerciseRepoSQL, ResultRepoSQL, migrate,
)
from .memory import (        # noqa: F401
    UserRepoMem, ExerciseRepoMem, ResultRepoMem,
)

__all__ = [  # gợi ý, không bắt buộc
    "IUserRepo", "IExerciseRepo", "IResultRepo",
    "UserRepoSQL", "ExerciseRepoSQL", "ResultRepoSQL",
    "UserRepoMem", "ExerciseRepoMem", "ResultRepoMem",
    "migrate",
]

