from collections import defaultdict

from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever

try:
    from .config import VECTOR_TOP_K, BM25_TOP_K, FINAL_TOP_K, RRF_K
    from .vector_store import get_vector_store
except ImportError:
    from config import VECTOR_TOP_K, BM25_TOP_K, FINAL_TOP_K, RRF_K
    from vector_store import get_vector_store


def load_all_indexed_documents(store) -> list[Document]:
    """Load indexed text into memory to build BM25 for this simple starter."""
    result = store.get(include=["documents", "metadatas"])
    documents = result.get("documents") or []
    metadatas = result.get("metadatas") or []

    output = []
    for text, metadata in zip(documents, metadatas):
        if text and text.strip():
            output.append(Document(page_content=text, metadata=metadata or {}))
    return output


def _doc_key(doc: Document) -> str:
    return str(
        doc.metadata.get("chunk_id")
        or (
            doc.metadata.get("source_id"),
            doc.metadata.get("page_number"),
            doc.metadata.get("start_index"),
            doc.page_content[:100],
        )
    )


def reciprocal_rank_fusion(
    ranked_lists: list[list[Document]], rrf_k: int = RRF_K
) -> list[Document]:
    scores = defaultdict(float)
    unique_docs = {}

    for ranked_docs in ranked_lists:
        seen_in_list = set()
        for rank, doc in enumerate(ranked_docs, start=1):
            key = _doc_key(doc)
            if key in seen_in_list:
                continue
            seen_in_list.add(key)
            scores[key] += 1.0 / (rrf_k + rank)
            unique_docs[key] = doc

    ordered_keys = sorted(scores, key=scores.get, reverse=True)
    return [unique_docs[key] for key in ordered_keys]


class HybridRetriever:
    """BM25 keyword search + Chroma dense search + Reciprocal Rank Fusion."""

    def __init__(self, store=None):
        self.store = store or get_vector_store()
        self.reload()

    def reload(self):
        """Reload indexed documents from Chroma and re-fit BM25."""
        all_docs = load_all_indexed_documents(self.store)
        self.doc_count = len(all_docs)
        if all_docs:
            self.bm25 = BM25Retriever.from_documents(all_docs)
            self.bm25.k = BM25_TOP_K
        else:
            self.bm25 = None

        self.vector_retriever = self.store.as_retriever(
            search_kwargs={"k": VECTOR_TOP_K}
        )
        print(f"[retrieval] Loaded {len(all_docs)} chunks for BM25 + vector search")

    def invoke(self, question: str) -> list[Document]:
        if not self.bm25:
            # Fallback to vector search only if BM25 is not populated
            return self.vector_retriever.invoke(question)[:FINAL_TOP_K]

        keyword_results = self.bm25.invoke(question)
        vector_results = self.vector_retriever.invoke(question)
        fused = reciprocal_rank_fusion([keyword_results, vector_results])
        return fused[:FINAL_TOP_K]
