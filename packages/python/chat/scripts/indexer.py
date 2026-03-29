"""
Indexes tax knowledge documents into a ChromaDB vector database.
Before running this script, you need to download the IRS forms and flows using the running scripts/irs-forms.py script.

Run this once before starting the chatbot:
    python indexer.py

Documents indexed:
  - data/irs_forms/  : IRS tax form PDFs (text extracted)
  - data/flows/      : End-to-end tax workflow examples
"""

import sys
import time
import chromadb
import fitz
from chromadb.utils import embedding_functions
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "data"

IRS_FORMS_DIR = DATA_DIR / "irs_forms"
FLOWS_DIR = DATA_DIR / "flows"
CHROMA_DIR = SCRIPT_DIR / "chroma_db"

COLLECTION_NAME = "tax_knowledge"


EMBED_MODEL = "all-MiniLM-L6-v2"

BATCH_SIZE = 500

CHUNK_SIZE = 1500    
CHUNK_OVERLAP = 200   


def extract_pdf_text(pdf_path: Path) -> str:
    """Extract all text from a PDF using PyMuPDF."""
    try:
        doc = fitz.open(str(pdf_path))
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n\n".join(pages).strip()
    except Exception as e:
        print(f"  WARNING: could not extract text from {pdf_path.name}: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks, breaking on paragraph boundaries."""
    if len(text) <= chunk_size:
        return [text]

    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(candidate) > chunk_size and current:
            chunks.append(current)
            # keep tail of current chunk as overlap seed
            current = current[-overlap:] + "\n\n" + para if overlap else para
        else:
            current = candidate

    if current.strip():
        chunks.append(current.strip())

    return chunks


def collect_pdf_documents(directory: Path) -> list[dict]:
    """Scan a directory for PDFs, extract text, chunk, and return doc dicts."""
    docs = []
    if not directory.exists():
        print(f"  Skipping {directory} (not found)")
        return docs

    pdf_files = sorted(directory.glob("*.pdf"))
    print(f"  {directory.relative_to(DATA_DIR)}: {len(pdf_files)} PDFs")

    for pdf_path in pdf_files:
        text = extract_pdf_text(pdf_path)
        if not text:
            continue

        name = pdf_path.stem
        rel_path = str(pdf_path.relative_to(DATA_DIR))
        chunks = chunk_text(text)

        for ci, chunk in enumerate(chunks):
            chunk_id = f"form::{rel_path}::chunk{ci}"
            docs.append({
                "id": chunk_id,
                "text": chunk,
                "metadata": {
                    "source": "irs_form",
                    "form": name,
                    "file": rel_path,
                    "chunk": ci,
                    "total_chunks": len(chunks),
                },
            })

    return docs


def collect_documents() -> list[dict]:
    """Walk data/irs_forms and data/flows, return a list of {id, text, metadata} dicts."""
    docs = []

    docs.extend(collect_pdf_documents(IRS_FORMS_DIR))

    for flow_dir in sorted(FLOWS_DIR.rglob("*")):
        if not flow_dir.is_dir():
            continue
        for txt_path in sorted(flow_dir.glob("*.txt")):
            text = txt_path.read_text(encoding="utf-8", errors="ignore").strip()
            if not text:
                continue
            docs.append({
                "id": f"flow::{txt_path.relative_to(DATA_DIR)}",
                "text": text,
                "metadata": {
                    "source": "flow_example",
                    "flow": flow_dir.name,
                    "file": str(txt_path.relative_to(DATA_DIR)),
                },
            })

    return docs


def build_index(reset: bool = False) -> None:
    print(f"Data directory  : {DATA_DIR}")
    print(f"ChromaDB path   : {CHROMA_DIR}")
    print(f"Embedding model : {EMBED_MODEL}\n")


    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )

    if reset and COLLECTION_NAME in [c.name for c in client.list_collections()]:
        print(f"Deleting existing collection '{COLLECTION_NAME}' …")
        client.delete_collection(COLLECTION_NAME)

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},
    )

    existing_ids = set(collection.get(include=[])["ids"])
    print(f"Existing documents in collection: {len(existing_ids)}")


    print("Scanning source directories …")
    all_docs = collect_documents()
    print(f"Total documents found: {len(all_docs)}")


    new_docs = [d for d in all_docs if d["id"] not in existing_ids]
    print(f"New documents to index: {len(new_docs)}\n")

    if not new_docs:
        print("Nothing to index. Run with --reset to force re-indexing.")
        return


    start = time.time()
    total_batches = (len(new_docs) + BATCH_SIZE - 1) // BATCH_SIZE
    for i in range(0, len(new_docs), BATCH_SIZE):
        batch = new_docs[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        print(f"  Batch {batch_num}/{total_batches} — {len(batch)} docs …", end=" ", flush=True)
        collection.add(
            ids=[d["id"] for d in batch],
            documents=[d["text"] for d in batch],
            metadatas=[d["metadata"] for d in batch],
        )
        print("done")

    elapsed = time.time() - start
    print(f"\nIndexed {len(new_docs)} documents in {elapsed:.1f}s")
    print(f"Collection total: {collection.count()} documents")


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    if reset_flag:
        print("--reset flag detected: will delete and rebuild the index.\n")
    build_index(reset=reset_flag)
