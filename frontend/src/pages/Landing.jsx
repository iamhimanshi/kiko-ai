import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, ArrowRight, Search, Youtube, MousePointerClick, Clock3, Target, ShieldCheck, LineChart, BookOpen, ListChecks, MessageSquareText } from 'lucide-react'
import FocusStatus from '../components/FocusStatus'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { startDemo } = useAuth()
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')

  async function handleViewDemo() {
    setDemoError('')
    setDemoLoading(true)
    try {
      await startDemo()
      navigate('/dashboard')
    } catch {
      setDemoError('Could not start the demo. Try again.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Navbar */}
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={22} className="text-brand" strokeWidth={2.2} />
          <span className="font-display text-lg font-semibold tracking-tight">KIKO AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
          <a href="#assistant" className="hover:text-ink transition-colors">AI Assistant</a>
        </nav>
        <button
          onClick={handleViewDemo}
          disabled={demoLoading}
          className="text-sm bg-brand text-white font-medium px-4 py-2 rounded hover:bg-brand-dark transition disabled:opacity-60"
        >
          {demoLoading ? 'Starting…' : 'View Demo'}
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <h1 className="font-display text-h1 sm:text-display text-ink">
            STUDY WITH INTENT.
            <br />
            <span className="text-brand-light">Stay focused. Learn smarter.</span>
          </h1>
          <p className="text-muted text-lg mt-6 max-w-lg leading-relaxed">
            KIKO AI helps you study with AI while keeping your internet activity aligned with your study goal.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link
              to="/signup"
              className="flex items-center gap-2 bg-brand text-white font-medium px-6 py-3 rounded hover:bg-brand-dark transition"
            >
              Start Studying <ArrowRight size={16} />
            </Link>
            <button
              onClick={handleViewDemo}
              disabled={demoLoading}
              className="text-ink border border-border px-6 py-3 rounded hover:border-brand-light transition disabled:opacity-60"
            >
              {demoLoading ? 'Starting…' : 'View Demo'}
            </button>
          </div>
          {demoError && <p className="text-sm text-danger mt-3">{demoError}</p>}
        </div>

        {/* Stylized dashboard preview — design brief §15 */}
        <div className="bg-card border border-border rounded-lg shadow-card p-8">
          <p className="text-xs text-subtle tracking-wide mb-1">STUDY SESSION</p>
          <p className="font-display text-h4 text-ink mb-6">Linked Lists</p>
          <p className="font-display text-[44px] leading-none text-ink text-center mb-6">38:24</p>
          <div className="flex justify-center mb-6">
            <FocusStatus status="focused" large />
          </div>
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Focus Score</span>
            <span className="text-ink font-medium">87%</span>
          </div>
          <div className="h-2 rounded-full bg-cardElevated overflow-hidden">
            <div className="h-full bg-focus" style={{ width: '87%' }} />
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="font-display text-h2 text-ink text-center max-w-2xl mx-auto">
          The internet is both your classroom and your biggest distraction.
        </h2>

        <div className="grid md:grid-cols-2 gap-10 mt-14 items-center">
          <div className="flex flex-col items-center gap-3 text-muted text-sm">
            {[
              { icon: BookOpen, label: 'Study' },
              { icon: Search, label: 'Search' },
              { icon: Youtube, label: 'YouTube' },
              { icon: MousePointerClick, label: 'Recommended video' },
              { icon: MousePointerClick, label: 'One click' },
              { icon: Clock3, label: '20 minutes gone', danger: true },
            ].map(({ icon: Icon, label, danger }, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`flex items-center gap-2 ${danger ? 'text-distract' : ''}`}>
                  <Icon size={16} /> {label}
                </div>
                {i < 5 && <div className="w-px h-4 bg-border my-1" />}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 text-sm">
            {[
              { icon: Target, label: 'Study Goal' },
              { icon: ShieldCheck, label: 'Understand activity' },
              { icon: ShieldCheck, label: 'Detect distraction' },
              { icon: MessageSquareText, label: 'Intervene' },
              { icon: LineChart, label: 'Analyze', focus: true },
            ].map(({ icon: Icon, label, focus }, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`flex items-center gap-2 ${focus ? 'text-focus' : 'text-ink'}`}>
                  <Icon size={16} /> {label}
                </div>
                {i < 4 && <div className="w-px h-4 bg-border my-1" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature columns */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-border grid md:grid-cols-3 gap-10">
        <FeatureColumn
          title="LEARN"
          tagline="AI-powered learning tools."
          items={['Summary', 'Flashcards', 'Quiz', 'Study Mentor']}
          icon={BookOpen}
        />
        <FeatureColumn
          title="FOCUS"
          tagline="Stay aligned with your goal."
          items={['Study Sessions', 'Goal-based detection', 'Smart warnings', 'Tab monitoring']}
          icon={Target}
        />
        <FeatureColumn
          title="REFLECT"
          tagline="Understand your study behavior."
          items={['Focus time', 'Distraction time', 'Session analysis', 'AI insights']}
          icon={LineChart}
        />
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-border text-center text-xs text-subtle">
        KIKO AI — Kickstart Your Focus Era with AI
      </footer>
    </div>
  )
}

function FeatureColumn({ title, tagline, items, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-brand-light" />
        <h3 className="font-display text-h4 text-ink tracking-wide">{title}</h3>
      </div>
      <p className="text-sm text-muted mb-4">{tagline}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-ink">
            <ListChecks size={14} className="text-subtle shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
