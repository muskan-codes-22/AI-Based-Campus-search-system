import os
import re
import logging
from typing import List, Optional
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

try:
    from .config import NVIDIA_MODEL, MAX_CONTEXT_CHARS
except ImportError:
    from config import NVIDIA_MODEL, MAX_CONTEXT_CHARS

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an expert AI campus academic and search assistant. You provide clean, professional, accurate, and beautifully structured responses.

CRITICAL INSTRUCTIONS & CONTRACT:
- Output ONLY the final answer in clean, GitHub-flavored Markdown.
- NEVER output reasoning, planning, scratchpad text, "Let me think", <think> tags, or meta-commentary (such as "The user is asking...", "Let me structure this...").
- Begin your answer immediately without preamble or internal reflection.

ANSWER STRUCTURE & FORMATTING:
1. Short Direct Answer: Open immediately with a concise direct answer or executive summary.
2. Section Headings: Use ## and ### headings to organize distinct sections and multi-part topics.
3. Bullet & Numbered Lists: Use lists for key concepts, steps, properties, or rules.
4. Tables: Use GitHub-flavored Markdown tables for any comparison, classification, runtime complexity breakdown, or attribute mapping.
5. Code Blocks: Use fenced code blocks with appropriate language tags (e.g., ```python, ```cpp, ```java, ```text) for algorithms, pseudocode, or formulas.
6. Sources Line: Conclude with a brief "Sources" line citing supporting documents in the format `[filename, page N]`.

GROUNDING & TRUTHFULNESS:
- Answer ONLY from the retrieved campus context provided in <context> blocks.
- Do NOT assume, extrapolate, or invent facts not present in the reference documents.
- If the retrieved context does not contain enough information to answer the question, state plainly and honestly: "I could not find relevant information in the indexed campus documents."

LANGUAGE:
- Professional, accessible English by default.
- If the user writes or asks in Hindi or Hinglish, answer naturally in Hinglish while maintaining the same clean, professional Markdown structure.
"""


def strip_thinking_tags(text: str) -> str:
    """Strip <think>...</think> reasoning blocks and scratchpads."""
    if not text:
        return ""
    # Strip <think>...</think> tags and enclosed reasoning
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text)
    # Strip unclosed <think> tag if model cut off mid-thought
    cleaned = re.sub(r"<think>[\s\S]*$", "", cleaned)
    return cleaned.strip()


def create_llm() -> ChatNVIDIA:
    if not os.getenv("NVIDIA_API_KEY"):
        raise RuntimeError(
            "NVIDIA_API_KEY is missing. Check your .env file and ensure NVIDIA_API_KEY is defined."
        )

    llm = ChatNVIDIA(
        model=NVIDIA_MODEL,
        temperature=0.2,
        max_completion_tokens=2048,
    )
    if hasattr(llm, "_client"):
        llm._client.timeout = 180
    return llm


def format_context(documents) -> str:
    pieces = []
    current_length = 0

    for doc in documents:
        filename = doc.metadata.get("source_filename", doc.metadata.get("source", "unknown"))
        page = doc.metadata.get("page_number", "?")
        block = (
            f"[Source: {filename}, page {page}]\n"
            f"{doc.page_content.strip()}"
        )
        if current_length + len(block) > MAX_CONTEXT_CHARS:
            remaining = MAX_CONTEXT_CHARS - current_length
            if remaining > 300:
                pieces.append(block[:remaining])
            break
        pieces.append(block)
        current_length += len(block) + 2

    return "\n\n".join(pieces)


def format_chat_history(history: Optional[List[dict]], max_turns: int = 6) -> str:
    if not history:
        return ""
    recent = history[-max_turns:]
    lines = []
    for msg in recent:
        role = "User" if msg.get("role") == "user" else "Assistant"
        content = (msg.get("content") or "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


def answer_question(
    llm,
    question: str,
    documents,
    history: Optional[List[dict]] = None,
) -> str:
    trimmed_q = question.strip()
    lower_q = trimmed_q.lower()

    # Friendly greeting fallback if no documents matched
    if lower_q in {"hi", "hello", "hey", "namaste", "good morning", "good evening", "good afternoon"}:
        if not documents:
            return "Hello! I am your Campus AI assistant. How can I help you today? You can ask me any question about your indexed campus documents."

    if not documents:
        return "I could not find relevant information in the indexed campus documents. Please upload the relevant document or try asking with different keywords."

    context = format_context(documents)
    history_text = format_chat_history(history)
    history_block = f"Recent conversation:\n{history_text}\n\n" if history_text else ""

    human_prompt = f"""Retrieved context:
<context>
{context}
</context>

{history_block}User question:
{trimmed_q}"""

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=human_prompt),
    ]

    try:
        response = llm.invoke(messages)
        raw_content = response.content if hasattr(response, "content") else str(response)
        cleaned_answer = strip_thinking_tags(str(raw_content or "").strip())

        if not cleaned_answer:
            logger.warning("[generation] LLM returned empty content after stripping thinking tags.")
            return "I couldn't generate an answer. Please try rephrasing your question."

        return cleaned_answer
    except Exception as exc:
        logger.error(f"[generation error] Error during LLM generation: {exc}", exc_info=True)
        return "I couldn't generate an answer. Please try rephrasing your question."
