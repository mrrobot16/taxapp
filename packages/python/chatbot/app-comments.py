"""
IRS Copilot — Tax Chatbot

A RAG-powered chatbot that answers US tax questions using IRS forms,
publications, and curated examples as the source of truth.

Usage:
    streamlit run app.py

Required environment variable (in a .env file at the repo root or chatbot dir):
    ANTHROPIC_API_KEY=sk-ant-...
"""

import os
import textwrap
from pathlib import Path

import chromadb
import streamlit as st
from anthropic import Anthropic
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
CHROMA_DIR = SCRIPT_DIR / "chroma_db"
COLLECTION_NAME = "tax_knowledge"
EMBED_MODEL = "all-MiniLM-L6-v2"

TOP_K = 8          # number of context chunks to retrieve per query
MAX_HISTORY = 10   # max conversation turns to keep in context
CLAUDE_MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are an expert US tax CPA assistant ("IRS Copilot") with deep knowledge \
of IRS forms, publications, and tax law. You only answer tax-related questions.

Rules:
- Base every answer strictly on the retrieved IRS context provided in the user turn.
- If the context doesn't contain enough information to answer confidently, say so clearly.
- Always mention the specific IRS form numbers or publication numbers that are relevant.
- Organize answers with clear headings and bullet points when listing forms or steps.
- Do not invent facts, citations, or form numbers.
- Keep a professional, helpful tone."""

# ---------------------------------------------------------------------------
# Load environment
# ---------------------------------------------------------------------------
load_dotenv(REPO_ROOT / ".env")
load_dotenv(SCRIPT_DIR / ".env")

# ---------------------------------------------------------------------------
# ChromaDB (cached so it loads only once per session)
# ---------------------------------------------------------------------------
@st.cache_resource(show_spinner="Loading knowledge base …")
def load_collection():
    if not CHROMA_DIR.exists():
        return None
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )
    try:
        return client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
        )
    except Exception:
        return None


def retrieve_context(collection, query: str, top_k: int = TOP_K) -> list[dict]:
    """Return the top_k most relevant document chunks for a query."""
    results = collection.query(
        query_texts=[query],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({"text": doc, "metadata": meta, "score": 1 - dist})
    return chunks


def build_context_block(chunks: list[dict]) -> str:
    """Format retrieved chunks into a readable context string for the LLM."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk["metadata"]
        source_label = {
            "form_summary": f"IRS Form Summary — {meta.get('form', 'unknown')}",
            "irs_form": f"IRS Form — {meta.get('form', 'unknown')}",
            "form_instructions": f"Form Instructions — {meta.get('form', 'unknown')}",
            "form_instructions_combined": f"Form & Instructions — {meta.get('form', 'unknown')}",
            "irs_publication": f"IRS Publication — {meta.get('publication', 'unknown')}",
            "prompt_example": f"Tax Scenario Example — {meta.get('scenario', '')}",
            "flow_example": f"Tax Workflow — {meta.get('flow', '')}",
        }.get(meta.get("source", ""), meta.get("file", ""))
        parts.append(f"[Source {i}: {source_label}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def chat(client: Anthropic, messages: list[dict], user_query: str, context: str) -> str:
    """Send query + context to Claude and return the response text."""
    user_content = textwrap.dedent(f"""
        ## Retrieved IRS Knowledge Base Context

        {context}

        ---

        ## Question

        {user_query}
    """).strip()

    messages_payload = messages + [{"role": "user", "content": user_content}]

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages_payload,
    )
    return response.content[0].text


# ---------------------------------------------------------------------------
# Streamlit UI
# ---------------------------------------------------------------------------
def main():
    st.set_page_config(
        page_title="IRS Copilot",
        page_icon="🧾",
        layout="wide",
    )

    st.title("🧾 IRS Copilot")
    st.caption(
        "Ask any US tax question. Answers are grounded in IRS forms, "
        "publications, and curated tax scenarios."
    )

    # Sidebar
    with st.sidebar:
        st.header("Settings")
        api_key = st.text_input(
            "Anthropic API Key",
            value=os.getenv("ANTHROPIC_API_KEY", ""),
            type="password",
            help="Get a key at console.anthropic.com",
        )
        show_sources = st.toggle("Show retrieved sources", value=True)
        top_k = st.slider("Sources to retrieve", min_value=3, max_value=15, value=TOP_K)

        st.divider()
        if st.button("Clear conversation"):
            st.session_state.messages = []
            st.session_state.history = []
            st.rerun()

        st.divider()
        st.markdown(
            "**Knowledge base**: 2025 IRS forms, instructions, publications, "
            "and tax scenario examples."
        )

    # Load knowledge base
    collection = load_collection()
    if collection is None:
        st.error(
            "Knowledge base not found. Please run the indexer first:\n\n"
            "```\ncd packages/python/chatbot\npython indexer.py\n```"
        )
        st.stop()

    doc_count = collection.count()
    st.sidebar.success(f"{doc_count:,} documents indexed")

    # Validate API key
    if not api_key:
        st.warning("Enter your Anthropic API key in the sidebar to start chatting.")
        st.stop()

    anthropic_client = Anthropic(api_key=api_key)

    # Session state
    if "messages" not in st.session_state:
        st.session_state.messages = []   # display messages (role, content, sources)
    if "history" not in st.session_state:
        st.session_state.history = []    # Claude API message history

    # Render conversation history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if show_sources and msg.get("sources"):
                with st.expander(f"Sources ({len(msg['sources'])} retrieved)", expanded=False):
                    for i, src in enumerate(msg["sources"], 1):
                        meta = src["metadata"]
                        label = meta.get("file", f"Source {i}")
                        score = src["score"]
                        st.markdown(f"**[{i}] {label}** *(relevance: {score:.2f})*")
                        st.text(src["text"][:500] + ("…" if len(src["text"]) > 500 else ""))
                        st.divider()

    # Chat input
    if prompt := st.chat_input("Ask a tax question …"):
        # Show user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # Retrieve context
        with st.spinner("Searching knowledge base …"):
            chunks = retrieve_context(collection, prompt, top_k=top_k)
            context_block = build_context_block(chunks)

        # Get Claude response
        with st.chat_message("assistant"):
            with st.spinner("Thinking …"):
                try:
                    answer = chat(
                        anthropic_client,
                        st.session_state.history[-MAX_HISTORY * 2:],
                        prompt,
                        context_block,
                    )
                except Exception as e:
                    st.error(f"API error: {e}")
                    st.stop()

            st.markdown(answer)

            if show_sources and chunks:
                with st.expander(f"Sources ({len(chunks)} retrieved)", expanded=False):
                    for i, src in enumerate(chunks, 1):
                        meta = src["metadata"]
                        label = meta.get("file", f"Source {i}")
                        score = src["score"]
                        st.markdown(f"**[{i}] {label}** *(relevance: {score:.2f})*")
                        st.text(src["text"][:500] + ("…" if len(src["text"]) > 500 else ""))
                        st.divider()

        # Update state
        st.session_state.messages.append({
            "role": "assistant",
            "content": answer,
            "sources": chunks,
        })

        # Update Claude API history (plain role/content pairs, no context block
        # repeated — we re-retrieve fresh context on each turn)
        st.session_state.history.append({"role": "user", "content": prompt})
        st.session_state.history.append({"role": "assistant", "content": answer})


if __name__ == "__main__":
    main()
