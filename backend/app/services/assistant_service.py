"""
The AI-facing features: RAG chat, quiz generation, flashcards,
summarization, study plans.

Parsing logic (quiz/flashcard text -> structured JSON) is preserved
from the prototype essentially unchanged — it already worked, so per
the migration plan we reuse it rather than rewrite it from scratch.
"""
import re
from typing import List

from fastapi import HTTPException

from app.services import ai_service, document_service, rag_service


async def chat(user_email: str, document_id: str, question: str) -> dict:
    doc = await document_service.get_owned_document(user_email, document_id)
    chunks: List[str] = doc["chunks"]

    try:
        index = rag_service.get_or_build_index(document_id, chunks)
        matched_indices = rag_service.search(index, question)

        relevant_chunks = [chunks[i] for i in matched_indices if i < len(chunks)]

        if not relevant_chunks:
            return {
                "question": question,
                "answer": "I couldn't find relevant information in this PDF for your question.",
                "sources": [],
            }

        context = "\n\n".join(relevant_chunks)
        prompt = f"""
You are a helpful AI study assistant. Answer the question based ONLY on the context provided.
If you cannot answer from the context, say "I cannot find this information in the provided PDF."

Context:
{context}

Question: {question}

Answer:
"""
        answer = ai_service.generate(prompt)

        sources = [
            {"chunk": chunks[i][:200] + "...", "index": int(i)}
            for i in matched_indices
            if i < len(chunks)
        ]

        return {"question": question, "answer": answer, "sources": sources}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


async def generate_quiz(user_email: str, document_id: str, num_questions: int) -> dict:
    doc = await document_service.get_owned_document(user_email, document_id)
    chunks: List[str] = doc["chunks"]

    if len(chunks) == 0:
        raise HTTPException(status_code=400, detail="PDF has no text content")

    text_for_quiz = " ".join(chunks[:10])

    prompt = f"""
Generate exactly {num_questions} multiple choice questions based on the following text.
Each question must have 4 options (A, B, C, D) and indicate the correct answer.

Format each question EXACTLY like this:
Q1: What is the main topic?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: A

Text:
{text_for_quiz}

Generate exactly {num_questions} questions:
"""
    response = ai_service.generate(prompt)
    questions = _parse_quiz(response)

    if len(questions) == 0:
        return {"questions": [], "total": 0, "error": "Could not generate quiz questions. Please try again."}

    return {"questions": questions, "total": len(questions), "error": None}


def _parse_quiz(response: str) -> List[dict]:
    questions = []
    lines = response.strip().split("\n")

    current_q, current_options, current_answer = None, [], None

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r"^Q\d+[:.]", line):
            if current_q and current_options:
                questions.append({
                    "question": current_q,
                    "options": current_options.copy(),
                    "answer": current_answer or "Answer not specified",
                })
            current_q, current_options, current_answer = line, [], None
        elif re.match(r"^[A-D][).]", line) and current_q:
            current_options.append(line)
        elif line.lower().startswith("answer:") and current_q:
            current_answer = line

    if current_q and current_options:
        questions.append({
            "question": current_q,
            "options": current_options.copy(),
            "answer": current_answer or "Answer not specified",
        })

    if len(questions) == 0:
        q_blocks = re.split(r"(Q\d+[:.])", response)
        for i in range(1, len(q_blocks), 2):
            if i + 1 < len(q_blocks):
                q_label, q_content = q_blocks[i], q_blocks[i + 1]
                q_lines = q_content.strip().split("\n")
                if q_lines:
                    question_text = q_label + " " + q_lines[0].strip()
                    options, answer = [], None
                    for line in q_lines[1:]:
                        line = line.strip()
                        if re.match(r"^[A-D][).]", line):
                            options.append(line)
                        elif line.lower().startswith("answer:"):
                            answer = line
                    if question_text and options:
                        questions.append({
                            "question": question_text,
                            "options": options,
                            "answer": answer or "Answer not specified",
                        })

    return questions


async def summarize(user_email: str, document_id: str) -> dict:
    doc = await document_service.get_owned_document(user_email, document_id)
    chunks: List[str] = doc["chunks"]
    text_to_summarize = " ".join(chunks[:10])

    prompt = f"""
You are a study assistant. Summarize the following text in a clear, structured way.
Use bullet points for key concepts.
Keep it concise but comprehensive.

Text:
{text_to_summarize}

Summary:
"""
    return {"summary": ai_service.generate(prompt)}


async def generate_flashcards(user_email: str, document_id: str) -> dict:
    doc = await document_service.get_owned_document(user_email, document_id)
    chunks: List[str] = doc["chunks"]
    text_for_flashcards = " ".join(chunks[:6])

    prompt = f"""
Generate 5 flashcards (question and answer pairs) based on the following text.
Each flashcard should test key concepts.

Format each flashcard as:
Front: [Question]
Back: [Answer]

Text:
{text_for_flashcards}

Flashcards:
"""
    response = ai_service.generate(prompt)

    flashcards = []
    current_card: dict = {}
    for line in response.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("Front:"):
            if "front" in current_card and "back" in current_card:
                flashcards.append(current_card)
            current_card = {"front": line.replace("Front:", "").strip()}
        elif line.startswith("Back:"):
            current_card["back"] = line.replace("Back:", "").strip()

    if "front" in current_card and "back" in current_card:
        flashcards.append(current_card)

    return {"flashcards": flashcards}


async def study_plan(subjects: str, days: int, hours_per_day: float) -> dict:
    prompt = f"""
Create a study plan for the following subjects:
{subjects}

Time available:
- {days} days
- {hours_per_day} hours per day

Create a day-by-day plan with specific topics and time allocation.
Make it realistic and include revision days.

Study Plan:
"""
    return {"study_plan": ai_service.generate(prompt)}
