import sys
from pathlib import Path

# Ensure src is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv
from config import BASE_DIR

load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

from generation import create_llm, answer_question
from retrieval import HybridRetriever


def main():
    print("=== PDF RAG: Hybrid Search ===")
    print("Make sure you have run `python ingest.py` after adding PDFs.")

    try:
        retriever = HybridRetriever()
        llm = create_llm()
    except Exception as exc:
        print(f"[startup error] {exc}")
        return

    print("Ready. Ask questions about your indexed PDFs. Type 'exit' to quit.")

    while True:
        try:
            question = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if question.lower() in {"exit", "quit"}:
            print("Goodbye.")
            break
        if not question:
            print("Please enter a question.")
            continue

        try:
            documents = retriever.invoke(question)
            print("\n[Retrieved evidence]")
            for index, doc in enumerate(documents, start=1):
                filename = doc.metadata.get(
                    "source_filename", doc.metadata.get("source", "unknown")
                )
                page = doc.metadata.get("page_number", "?")
                preview = doc.page_content[:180].replace("\n", " ")
                print(f"{index}. {filename}, page {page}: {preview}...")

            print("\n[Answer]")
            print(answer_question(llm, question, documents))
        except Exception as exc:
            # Avoid printing API keys or request headers. Keep the error concise.
            print(f"[query error] The request failed: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()
