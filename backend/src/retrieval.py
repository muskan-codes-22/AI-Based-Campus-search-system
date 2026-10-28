import re
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
    """Load indexed text into memory to build BM25 with filename/source metadata enrichment."""
    result = store.get(include=["documents", "metadatas"])
    documents = result.get("documents") or []
    metadatas = result.get("metadatas") or []

    output = []
    for text, metadata in zip(documents, metadatas):
        if text and text.strip():
            meta = metadata or {}
            fn = meta.get("source_filename", "")
            # Prepend filename and source tokens so queries mentioning "resume", "question bank",
            # "handbook", "lecture" or specific filenames directly match on BM25 keyword search
            enriched_text = f"Document: {fn}\nSource: {fn}\n{text}"
            output.append(Document(page_content=enriched_text, metadata=meta))
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
    ranked_lists: list[list[Document]],
    rrf_k: int = RRF_K,
    max_per_source: int = 5,
    final_k: int = FINAL_TOP_K,
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

            # Strip the temporary enriched prefix if present to pass clean context to LLM
            raw_doc = doc
            if doc.page_content.startswith("Document: "):
                lines = doc.page_content.split("\n", 2)
                clean_text = lines[2] if len(lines) > 2 else doc.page_content
                raw_doc = Document(page_content=clean_text, metadata=doc.metadata)

            unique_docs[key] = raw_doc

    ordered_keys = sorted(scores, key=scores.get, reverse=True)

    # Source diversity: prevent a single large multi-page file (like a 700-page handbook) from monopolizing all slots
    result = []
    source_counts = defaultdict(int)
    overflow = []

    for key in ordered_keys:
        doc = unique_docs[key]
        src = doc.metadata.get("source_filename", "unknown")
        if source_counts[src] < max_per_source:
            result.append(doc)
            source_counts[src] += 1
        else:
            overflow.append(doc)

    # Fill remaining capacity from overflow if needed
    if len(result) < final_k:
        result.extend(overflow[: final_k - len(result)])

    return result[:final_k]


def clean_bm25_tokenizer(text: str) -> list[str]:
    """Clean tokenizer stripping punctuation, parentheses, and possessives like 's."""
    cleaned = re.sub(r"'s\b", "", text.lower())
    return re.findall(r"[a-z0-9]+", cleaned)


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
            self.bm25 = BM25Retriever.from_documents(all_docs, preprocess_func=clean_bm25_tokenizer)
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
        fused = reciprocal_rank_fusion([keyword_results, vector_results], max_per_source=5, final_k=FINAL_TOP_K)
        return fused
