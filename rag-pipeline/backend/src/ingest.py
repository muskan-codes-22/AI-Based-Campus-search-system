import hashlib
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from .config import DATA_DIR, CHROMA_DIR, CHUNK_SIZE, CHUNK_OVERLAP
    from .vector_store import get_vector_store
except ImportError:
    from config import DATA_DIR, CHROMA_DIR, CHUNK_SIZE, CHUNK_OVERLAP
    from vector_store import get_vector_store


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stable_source_id(path: Path) -> str:
    # The relative path identifies the logical document across file updates.
    try:
        relative = str(path.resolve().relative_to(DATA_DIR.resolve())).replace("\\", "/")
    except ValueError:
        relative = path.name
    return hashlib.sha256(relative.encode("utf-8")).hexdigest()[:24]


def ingest_pdf(path: Path, store) -> tuple[int, str]:
    file_hash = sha256_file(path)
    source_id = stable_source_id(path)

    existing = store.get(where={"source_id": source_id}, include=["metadatas"])
    old_metadata = existing.get("metadatas") or []

    if old_metadata and all(m.get("file_hash") == file_hash for m in old_metadata):
        print(f"[skip] Unchanged: {path.name}")
        return len(old_metadata), "unchanged"

    # Remove old chunks when this same file path has changed.
    if old_metadata:
        store.delete(where={"source_id": source_id})
        print(f"[update] Removed previous index for: {path.name}")

    pages = PyPDFLoader(str(path)).load()
    if not pages:
        print(f"[skip] No pages extracted: {path.name}")
        return 0, "empty"

    # Preserve source metadata, and add stable identifiers for citations/updates.
    for page_index, doc in enumerate(pages):
        doc.metadata["source_filename"] = path.name
        doc.metadata["source_id"] = source_id
        doc.metadata["file_hash"] = file_hash
        doc.metadata["page_number"] = int(doc.metadata.get("page", page_index)) + 1

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(pages)
    chunks = [chunk for chunk in chunks if chunk.page_content.strip()]

    if not chunks:
        print(f"[skip] No extractable text in {path.name}. Scanned PDFs may need OCR.")
        return 0, "empty"

    ids = []
    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = index
        chunk.metadata["source_filename"] = path.name
        chunk.metadata["source_id"] = source_id
        chunk.metadata["file_hash"] = file_hash
        chunk.metadata["page_number"] = int(
            chunk.metadata.get("page_number", chunk.metadata.get("page", 0) + 1)
        )
        chunk_id = hashlib.sha256(
            f"{source_id}:{file_hash}:{index}".encode("utf-8")
        ).hexdigest()
        chunk.metadata["chunk_id"] = chunk_id
        ids.append(chunk_id)

    store.add_documents(chunks, ids=ids)
    print(f"[indexed] {path.name}: {len(pages)} pages, {len(chunks)} chunks")
    return len(chunks), "indexed"


def delete_document_from_store(filename: str, store) -> int:
    """Delete chunks for a specific file by source_filename."""
    existing = store.get(where={"source_filename": filename}, include=["metadatas"])
    ids = existing.get("ids") or []
    if ids:
        store.delete(ids=ids)
        print(f"[delete] Removed {len(ids)} chunks for: {filename}")
    return len(ids)


def main():
    pdfs = sorted(DATA_DIR.rglob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found. Put PDF files inside: {DATA_DIR}")
        return

    store = get_vector_store()
    total_chunks = 0
    for path in pdfs:
        try:
            count, status = ingest_pdf(path, store)
            if status == "indexed":
                total_chunks += count
        except Exception as exc:
            print(f"[error] Could not ingest {path.name}: {exc}")

    print(f"Done. Newly indexed chunks: {total_chunks}")
    print(f"Persistent Chroma directory: {CHROMA_DIR.resolve()}")


if __name__ == "__main__":
    main()
