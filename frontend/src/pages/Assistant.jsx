import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Send, FileText, Loader2 } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import * as documentsApi from '../services/documentsApi'
import * as assistantApi from '../services/assistantApi'

const TABS = ['Study Mentor', 'Summary', 'Flashcards', 'Quiz', 'Study Plan']

export default function Assistant() {
  const location = useLocation()
  const navigate = useNavigate()

  const [documents, setDocuments] = useState([])
  const [documentId, setDocumentId] = useState(location.state?.documentId || '')
  const [activeTab, setActiveTab] = useState('Study Mentor')

  useEffect(() => {
    documentsApi.listDocuments().then(setDocuments).catch(() => {})
  }, [])

  const selectedDoc = documents.find((d) => d.id === documentId)

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display text-2xl font-semibold">Study Assistant</h1>

        <select
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-brand-light"
        >
          <option value="">Select a document…</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.filename}</option>
          ))}
        </select>
      </div>

      {!documentId ? (
        <EmptyState onGoToDashboard={() => navigate('/dashboard')} />
      ) : (
        <>
          <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-brand text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Study Mentor' && <ChatPanel documentId={documentId} />}
          {activeTab === 'Summary' && <SummaryPanel documentId={documentId} />}
          {activeTab === 'Flashcards' && <FlashcardsPanel documentId={documentId} />}
          {activeTab === 'Quiz' && <QuizPanel documentId={documentId} />}
          {activeTab === 'Study Plan' && <StudyPlanPanel />}
        </>
      )}
    </AppLayout>
  )
}

function EmptyState({ onGoToDashboard }) {
  return (
    <div className="text-center py-16 border border-border rounded-xl">
      <FileText size={28} className="text-muted mx-auto mb-3" />
      <p className="text-sm text-muted mb-4">Select a document above, or upload one from the dashboard.</p>
      <button onClick={onGoToDashboard} className="text-sm text-brand-light hover:underline">
        Go to dashboard →
      </button>
    </div>
  )
}

function ChatPanel({ documentId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    setMessages([])
  }, [documentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setSending(true)
    try {
      const data = await assistantApi.askQuestion(documentId, question)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer, sources: data.sources }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong answering that. Try again.', error: true }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-[32rem]">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted">Ask anything about this document — answers are grounded in its content.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
            <div
              className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand text-white'
                  : m.error
                  ? 'bg-danger/10 text-danger border border-danger/30'
                  : 'bg-cardElevated text-ink border border-border'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-muted text-sm">
            <Loader2 size={14} className="animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document…"
          className="flex-1 bg-cardElevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-light"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-brand text-white px-4 rounded-lg hover:bg-brand-dark transition disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

function SummaryPanel({ documentId }) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const data = await assistantApi.summarizeDocument(documentId)
      setSummary(data.summary)
    } catch {
      setError('Could not generate a summary. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition disabled:opacity-60 mb-5"
      >
        {loading ? 'Summarizing…' : summary ? 'Regenerate summary' : 'Generate summary'}
      </button>
      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {summary ? (
        <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{summary}</div>
      ) : (
        !loading && <p className="text-sm text-muted">No summary yet.</p>
      )}
    </div>
  )
}

function FlashcardsPanel({ documentId }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setFlipped({})
    try {
      const data = await assistantApi.generateFlashcards(documentId)
      setCards(data.flashcards)
    } catch {
      setError('Could not generate flashcards. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition disabled:opacity-60 mb-5"
      >
        {loading ? 'Generating…' : cards.length ? 'Regenerate flashcards' : 'Generate flashcards'}
      </button>
      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {cards.length === 0 && !loading && <p className="text-sm text-muted">No flashcards yet.</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }))}
            className="bg-card border border-border rounded-xl p-5 text-left min-h-[7rem] hover:border-brand-light/50 transition-colors"
          >
            <span className="text-xs text-muted block mb-2">{flipped[i] ? 'Answer' : 'Question'}</span>
            <span className="text-sm text-ink">{flipped[i] ? card.back : card.front}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuizPanel({ documentId }) {
  const [numQuestions, setNumQuestions] = useState(5)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setAnswers({})
    setRevealed(false)
    try {
      const data = await assistantApi.generateQuiz(documentId, numQuestions)
      if (data.error || data.questions.length === 0) {
        setError(data.error || 'Could not generate quiz questions. Try again.')
        setQuestions([])
      } else {
        setQuestions(data.questions)
      }
    } catch {
      setError('Could not generate a quiz. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm text-muted" htmlFor="numq">Questions</label>
        <input
          id="numq"
          type="number"
          min={1}
          max={20}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          className="w-16 bg-cardElevated border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-light"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition disabled:opacity-60"
        >
          {loading ? 'Generating…' : questions.length ? 'Regenerate quiz' : 'Generate quiz'}
        </button>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-medium text-ink mb-3">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const letter = opt.trim()[0]
                const isCorrect = revealed && q.answer.toUpperCase().includes(letter)
                const isPicked = answers[i] === oi
                return (
                  <button
                    key={oi}
                    onClick={() => !revealed && setAnswers((prev) => ({ ...prev, [i]: oi }))}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                      isCorrect
                        ? 'border-focus bg-focus/10 text-ink'
                        : isPicked
                        ? 'border-muted bg-cardElevated text-ink'
                        : 'border-border text-muted hover:text-ink hover:border-muted'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {questions.length > 0 && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="mt-5 text-sm text-brand-light hover:underline"
        >
          Reveal answers
        </button>
      )}
    </div>
  )
}

function StudyPlanPanel() {
  const [subjects, setSubjects] = useState('')
  const [days, setDays] = useState(7)
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await assistantApi.generateStudyPlan({ subjects, days, hoursPerDay })
      setPlan(data.study_plan)
    } catch {
      setError('Could not generate a study plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <form onSubmit={handleGenerate} className="grid sm:grid-cols-3 gap-4 mb-5">
        <div className="sm:col-span-3">
          <label className="block text-xs text-muted mb-1.5">Subjects (comma-separated)</label>
          <input
            required
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="Data Structures, Operating Systems, DBMS"
            className="w-full bg-cardElevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-light"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Days available</label>
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full bg-cardElevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-light"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Hours / day</label>
          <input
            type="number"
            min={0.5}
            max={24}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="w-full bg-cardElevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-light"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white text-sm font-medium py-2.5 rounded-lg hover:bg-brand-dark transition disabled:opacity-60"
          >
            {loading ? 'Planning…' : 'Generate plan'}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {plan && <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{plan}</div>}
    </div>
  )
}
