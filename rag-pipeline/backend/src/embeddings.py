from langchain_huggingface import HuggingFaceEmbeddings

try:
    from .config import EMBEDDING_MODEL, choose_embedding_device
except ImportError:
    from config import EMBEDDING_MODEL, choose_embedding_device


def create_embeddings() -> HuggingFaceEmbeddings:
    device = choose_embedding_device()
    print(f"[embeddings] Trying device: {device}")

    options = {
        "model_name": EMBEDDING_MODEL,
        "model_kwargs": {"device": device},
        "encode_kwargs": {
            "normalize_embeddings": True,
            "batch_size": 32 if device == "cuda" else 8,
        },
    }

    try:
        model = HuggingFaceEmbeddings(**options)
        # Force a small test so device/model errors happen here, not later.
        model.embed_query("embedding device test")
        print(f"[embeddings] Ready on {device.upper()}")
        return model
    except Exception as exc:
        if device == "cpu":
            raise RuntimeError(
                "Could not initialize the embedding model on CPU. "
                "Check the model download and package installation."
            ) from exc

        print(f"[embeddings] GPU initialization failed ({exc}). Falling back to CPU.")
        options["model_kwargs"] = {"device": "cpu"}
        options["encode_kwargs"]["batch_size"] = 8
        model = HuggingFaceEmbeddings(**options)
        model.embed_query("embedding device test")
        print("[embeddings] Ready on CPU")
        return model
