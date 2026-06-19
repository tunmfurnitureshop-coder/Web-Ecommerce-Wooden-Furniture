from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: dict = {}):
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "details": details})


def not_found(resource: str) -> AppException:
    return AppException(404, "NOT_FOUND", f"{resource} not found.")


def unauthorized() -> AppException:
    return AppException(401, "UNAUTHORIZED", "Authentication required.")


def forbidden() -> AppException:
    return AppException(403, "FORBIDDEN", "Access denied.")


def validation_error(message: str, details: dict = {}) -> AppException:
    return AppException(422, "VALIDATION_ERROR", message, details)


def conflict(code: str, message: str) -> AppException:
    return AppException(409, code, message)
