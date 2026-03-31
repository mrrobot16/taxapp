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

import chromadb
import streamlit as st
from anthropic import Anthropic
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

from constants import (
    CHAT_DIR,
    CHROMA_DIR,
    CLAUDE_MODEL,
    COLLECTION_NAME,
    EMBED_MODEL,
    MAX_HISTORY,
    REPO_ROOT,
    SYSTEM_PROMPT,
    TOP_K,
)
from scripts.indexer import build_index


load_dotenv(REPO_ROOT / ".env")
load_dotenv(CHAT_DIR / ".env")


@st.cache_resource(show_spinner="Loading knowledge base …")
def load_collection(_run_id: int = 0):
    """Load the ChromaDB collection, auto-indexing if it doesn't exist yet.

    The _run_id parameter is prefixed with _ so Streamlit ignores it for
    caching, but changing its value busts the cache (used by the re-index
    button).
    """
    if not CHROMA_DIR.exists():
        st.info("Knowledge base not found — building index for the first time. This may take a few minutes …")
        build_index()

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )
    try:
        collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
        )
    except Exception:
        st.info("Collection not found — building index. This may take a few minutes …")
        build_index()
        collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
        )
    return collection


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

        if st.button("Re-index knowledge base"):
            with st.spinner("Re-indexing … this may take a few minutes."):
                build_index(reset=True)
            load_collection.clear()
            st.session_state.index_run_id += 1
            st.rerun()

        st.divider()
        st.markdown(
            "**Knowledge base**: 2025 IRS forms, instructions, publications, "
            "and tax scenario examples."
        )

    if "index_run_id" not in st.session_state:
        st.session_state.index_run_id = 0

    collection = load_collection(_run_id=st.session_state.index_run_id)

    doc_count = collection.count()
    st.sidebar.success(f"{doc_count:,} documents indexed")

    if not api_key:
        st.warning("Enter your Anthropic API key in the sidebar to start chatting.")
        st.stop()

    anthropic_client = Anthropic(api_key=api_key)

    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "history" not in st.session_state:
        st.session_state.history = []

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

    if prompt := st.chat_input("Ask a tax question …"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.spinner("Searching knowledge base …"):
            chunks = retrieve_context(collection, prompt, top_k=top_k)
            context_block = build_context_block(chunks)

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

        st.session_state.messages.append({
            "role": "assistant",
            "content": answer,
            "sources": chunks,
        })

        st.session_state.history.append({"role": "user", "content": prompt})
        st.session_state.history.append({"role": "assistant", "content": answer})


if __name__ == "__main__":
    main()
