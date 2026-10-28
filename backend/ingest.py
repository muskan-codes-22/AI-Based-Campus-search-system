import sys
from pathlib import Path

# Add src to sys.path and run ingest main
src_dir = Path(__file__).resolve().parent / "src"
sys.path.insert(0, str(src_dir))

from src.ingest import main

if __name__ == "__main__":
    main()
