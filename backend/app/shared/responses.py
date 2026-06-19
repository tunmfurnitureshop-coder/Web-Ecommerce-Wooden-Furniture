from pydantic import BaseModel
from typing import Any, Optional


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail
