from abc import ABC, abstractmethod


class StorageInterface(ABC):
    @abstractmethod
    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        ...

    @abstractmethod
    async def delete(self, key: str):
        ...
