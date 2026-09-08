import api from './api'

export async function askQuestion(documentId, question) {
  const { data } = await api.post('/api/assistant/chat', { document_id: documentId, question })
  return data
}

export async function generateQuiz(documentId, numQuestions = 5) {
  const { data } = await api.post('/api/assistant/quiz', {
    document_id: documentId,
    num_questions: numQuestions,
  })
  return data
}

export async function summarizeDocument(documentId) {
  const { data } = await api.post('/api/assistant/summarize', { document_id: documentId })
  return data
}

export async function generateFlashcards(documentId) {
  const { data } = await api.post('/api/assistant/flashcards', { document_id: documentId })
  return data
}

export async function generateStudyPlan({ subjects, days, hoursPerDay }) {
  const { data } = await api.post('/api/assistant/study-plan', {
    subjects,
    days,
    hours_per_day: hoursPerDay,
  })
  return data
}
