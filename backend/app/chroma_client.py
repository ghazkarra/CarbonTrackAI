import hashlib
from collections.abc import Sequence

import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

from app.config import get_settings


class HashEmbeddingFunction(EmbeddingFunction[Documents]):
    def __call__(self, input: Documents) -> Embeddings:
        return [self.embed(document) for document in input]

    @staticmethod
    def embed(document: str) -> list[float]:
        digest = hashlib.sha256(document.lower().encode("utf-8")).digest()
        return [byte / 255 for byte in digest[:32]]


def get_chroma_collection():
    settings = get_settings()
    client = chromadb.PersistentClient(path=settings.chroma_db_path)
    return client.get_or_create_collection(name=settings.chroma_collection_name, embedding_function=HashEmbeddingFunction())


def query_collection(query_text: str, record_type: str, n_results: int = 3) -> dict:
    collection = get_chroma_collection()
    return collection.query(query_texts=[query_text], n_results=n_results, where={"record_type": record_type})
