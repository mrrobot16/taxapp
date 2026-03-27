"""
Indexes all tax knowledge documents into a ChromaDB vector database.

Run this once before starting the chatbot:
    python indexer.py

Documents indexed:
  - 2022-summaries/       : AI-generated text summaries of every IRS tax form
  - 2022-forms/forms/     : Original IRS tax form PDFs (text extracted)
  - 2022-forms/instructions/ : IRS form instruction PDFs (text extracted)
  - 2022-forms/form-instructions/ : Combined form-instruction PDFs (text extracted)
  - 2022-publications/    : IRS publication PDFs (text extracted)
  - prompts/              : Tax scenario prompts and expected responses
  - flows/                : End-to-end tax workflow examples
"""

import os
import sys
import time
import chromadb
import fitz  # PyMuPDF
from chromadb.utils import embedding_functions
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths (relative to the repo root, two levels above this file)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]  # packages/python/chatbot -> repo root

SUMMARIES_DIR = REPO_ROOT / "2022-summaries"
FORMS_DIR = REPO_ROOT / "2022-forms"
PUBLICATIONS_DIR = REPO_ROOT / "2022-publications"
PROMPTS_DIR = REPO_ROOT / "prompts"
FLOWS_DIR = REPO_ROOT / "flows"
CHROMA_DIR = SCRIPT_DIR / "chroma_db"

COLLECTION_NAME = "tax_knowledge"

# ---------------------------------------------------------------------------
# Embedding model (local, no API key required)
# ---------------------------------------------------------------------------
EMBED_MODEL = "all-MiniLM-L6-v2"

# ChromaDB batch size (keep well under the 5 461 item hard limit)
BATCH_SIZE = 500

# PDF chunking parameters
CHUNK_SIZE = 1500       # target characters per chunk
CHUNK_OVERLAP = 200     # overlap between consecutive chunks


# ---------------------------------------------------------------------------
# PDF helpers
# ---------------------------------------------------------------------------
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


def collect_pdf_documents(
    directory: Path,
    source_type: str,
    id_prefix: str,
    metadata_key: str = "form",
) -> list[dict]:
    """Scan a directory for PDFs, extract text, chunk, and return doc dicts."""
    docs = []
    if not directory.exists():
        print(f"  Skipping {directory} (not found)")
        return docs

    pdf_files = sorted(directory.glob("*.pdf"))
    print(f"  {directory.relative_to(REPO_ROOT)}: {len(pdf_files)} PDFs")

    for pdf_path in pdf_files:
        text = extract_pdf_text(pdf_path)
        if not text:
            continue

        name = pdf_path.stem
        rel_path = str(pdf_path.relative_to(REPO_ROOT))
        chunks = chunk_text(text)

        for ci, chunk in enumerate(chunks):
            chunk_id = f"{id_prefix}::{rel_path}::chunk{ci}"
            docs.append({
                "id": chunk_id,
                "text": chunk,
                "metadata": {
                    "source": source_type,
                    metadata_key: name,
                    "file": rel_path,
                    "chunk": ci,
                    "total_chunks": len(chunks),
                },
            })

    return docs


def collect_documents() -> list[dict]:
    """Walk source directories and return a list of {id, text, metadata} dicts."""
    docs = []

    # 1. Form summaries (.txt files anywhere under 2022-summaries/)
    for txt_path in sorted(SUMMARIES_DIR.rglob("*.txt")):
        text = txt_path.read_text(encoding="utf-8", errors="ignore").strip()
        if not text:
            continue
        form_name = txt_path.stem  # e.g. "1040", "W-2"
        docs.append({
            "id": f"summary::{txt_path.relative_to(REPO_ROOT)}",
            "text": text,
            "metadata": {
                "source": "form_summary",
                "form": form_name,
                "file": str(txt_path.relative_to(REPO_ROOT)),
            },
        })

    # 2. Prompt/response pairs under prompts/
    for prompt_dir in sorted(PROMPTS_DIR.iterdir()):
        if not prompt_dir.is_dir():
            continue
        for fname in ("prompt.txt", "response.txt", "expected_response_with_forms.txt"):
            fpath = prompt_dir / fname
            if not fpath.exists():
                continue
            text = fpath.read_text(encoding="utf-8", errors="ignore").strip()
            if not text:
                continue
            docs.append({
                "id": f"prompt::{fpath.relative_to(REPO_ROOT)}",
                "text": text,
                "metadata": {
                    "source": "prompt_example",
                    "scenario": prompt_dir.name,
                    "file": str(fpath.relative_to(REPO_ROOT)),
                },
            })

    # 3. Flow outputs under flows/
    for flow_dir in sorted(FLOWS_DIR.rglob("*")):
        if not flow_dir.is_dir():
            continue
        for txt_path in sorted(flow_dir.glob("*.txt")):
            text = txt_path.read_text(encoding="utf-8", errors="ignore").strip()
            if not text:
                continue
            docs.append({
                "id": f"flow::{txt_path.relative_to(REPO_ROOT)}",
                "text": text,
                "metadata": {
                    "source": "flow_example",
                    "flow": flow_dir.name,
                    "file": str(txt_path.relative_to(REPO_ROOT)),
                },
            })

    # 4. IRS form PDFs under 2022-forms/forms/
    docs.extend(collect_pdf_documents(
        FORMS_DIR / "forms",
        source_type="irs_form",
        id_prefix="form",
        metadata_key="form",
    ))

    # 5. Form instruction PDFs under 2022-forms/instructions/
    docs.extend(collect_pdf_documents(
        FORMS_DIR / "instructions",
        source_type="form_instructions",
        id_prefix="instructions",
        metadata_key="form",
    ))

    # 6. Combined form-instruction PDFs under 2022-forms/form-instructions/
    docs.extend(collect_pdf_documents(
        FORMS_DIR / "form-instructions",
        source_type="form_instructions_combined",
        id_prefix="form-instr",
        metadata_key="form",
    ))

    # 7. IRS publication PDFs under 2022-publications/
    docs.extend(collect_pdf_documents(
        PUBLICATIONS_DIR,
        source_type="irs_publication",
        id_prefix="pub",
        metadata_key="publication",
    ))

    return docs


def build_index(reset: bool = False) -> None:
    print(f"Repository root : {REPO_ROOT}")
    print(f"ChromaDB path   : {CHROMA_DIR}")
    print(f"Embedding model : {EMBED_MODEL}\n")

    # Setup ChromaDB
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

    # Collect all documents
    print("Scanning source directories …")
    all_docs = collect_documents()
    print(f"Total documents found: {len(all_docs)}")

    # Filter out already-indexed docs
    new_docs = [d for d in all_docs if d["id"] not in existing_ids]
    print(f"New documents to index: {len(new_docs)}\n")

    if not new_docs:
        print("Nothing to index. Run with --reset to force re-indexing.")
        return

    # Index in batches
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
