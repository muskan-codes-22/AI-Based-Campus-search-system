from langchain_chroma import Chroma

try:
    from .config import CHROMA_DIR, COLLECTION_NAME
    from .embeddings import create_embeddings
except ImportError:
    from config import CHROMA_DIR, COLLECTION_NAME
    from embeddings import create_embeddings


def get_vector_store() -> Chroma:
    """Open the persistent Chroma collection, creating it if needed."""
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
        embedding_function=create_embeddings(),
    )
