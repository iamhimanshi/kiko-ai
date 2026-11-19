import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Sparkles, Target, BarChart3, Shield, Zap,
  BookOpen, Clock, TrendingUp, Menu, X, Database,
  Brain, LineChart, Lock, CheckCircle2, XCircle,
  ChevronDown, Compass, Layers, Activity, MessageSquare
} from 'lucide-react';
import { useState } from 'react';

const DEVELOPERS = [
  {
    name: 'Himanshi',
    role: 'Backend & Database Engineer',
    icon: Database,
    iconBg: 'bg-[#172554]',
    iconColor: 'text-white',
    dotColor: 'bg-[#172554]',
    points: [
      'Architected the FastAPI backend with PostgreSQL and SQLAlchemy',
      'Built authentication, REST APIs and session management',
      'Designed the relational data model powering all Daydive features',
    ],
  },
  {
    name: 'Kanika Gupta',
    role: 'Frontend and AI Models',
    icon: Brain,
    iconBg: 'bg-[#FFF0EB]',
    iconColor: 'text-[#FF5C5C]',
    dotColor: 'bg-[#FF5C5C]',
    points: [
      'Integrated Groq LLM for summaries, flashcards, quizzes & AI Tutor',
      'Built the RAG pipeline with Sentence Transformers + FAISS',
      'Engineered prompts for grounded, material-aware responses',
    ],
  },
  {
    name: 'Rumana Khan',
    role: 'Analytics & Data Visualization',
    icon: LineChart,
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#22C55E]',
    dotColor: 'bg-[#22C55E]',
    points: [
      'Developed the deterministic analytics engine for focus scoring',
      'Built focus timelines, distraction breakdowns and website activity',
      'Designed all metrics, trends and session-report visualizations',
    ],
  },
  {
    name: 'Gargi Pathak',
    role: 'Security & Research',
    icon: Lock,
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#172033]',
    dotColor: 'bg-[#FFD166]',
    points: [
      'Implemented JWT authentication and bcrypt password security',
      'Enforced ownership checks, input validation & secure API boundaries',
      'Led product research, threat modelling and privacy design',
    ],
  },
];

const PIPELINE_STEPS = [
  { label: 'Plan', icon: Compass },
  { label: 'Learn', icon: BookOpen },
  { label: 'Focus', icon: Target },
  { label: 'Detect', icon: Activity },
  { label: 'Intervene', icon: Shield },
  { label: 'Analyze', icon: BarChart3 },
  { label: 'Improve', icon: TrendingUp },
];

const FAQS = [
  {
    q: 'What is Daydive?',
    a: 'Daydive is an intelligent study companion built for diving deeply into daily goals—combining AI-powered learning assistance, real-time focus monitoring, and study analytics.',
  },
  {
    q: 'How does Daydive detect distractions?',
    a: 'MindGuard analyzes your browsing activity, website context, and active study goal to determine whether you are staying on-track or drifting into distractions.',
  },
  {
    q: 'Does Daydive block websites?',
    a: 'No. Daydive guides you back to focus rather than blindly blocking sites. It understands the difference between educational and distracting content, and you can optionally add sites to a custom blocklist.',
  },
  {
    q: 'Can I use YouTube for studying?',
    a: 'Absolutely. YouTube tutorials and lectures are recognized as relevant study activity whenever they match your current session goal.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Passwords are hashed with bcrypt, all APIs are JWT-authenticated, and your documents and session data belong strictly to you.',
  },
];

function BrandLogo({ size = 'md' }) {
  const boxSize = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl';
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${boxSize} bg-[#172554] flex items-center justify-center shadow-sm relative overflow-hidden`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 15C6.5 12.5 9.5 12.5 12 15C14.5 17.5 17.5 17.5 20 15"
            stroke="#FF5C5C"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M6 9.5C8 7.5 10.5 7.5 12 9.5C13.5 11.5 16 11.5 18 9.5"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <span className={`${textSize} font-extrabold tracking-tight text-[#172554]`}>
          Day<span className="text-[#FF5C5C]">dive</span>
        </span>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#172033]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-3.5 flex items-center justify-between">
          <Link to="/" className="focus:outline-none">
            <BrandLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#172554] transition">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#172554] transition">How It Works</button>
            <button onClick={() => scrollToSection('developers')} className="hover:text-[#172554] transition">Team</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#172554] transition">FAQ</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm px-5 py-2.5">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-[#172554] hover:text-[#FF5C5C] px-3 py-2 text-sm font-semibold transition">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-[#172554] p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-6 py-4 space-y-3">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left text-[#475569] hover:text-[#FF5C5C] font-medium py-2 transition">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-[#475569] hover:text-[#FF5C5C] font-medium py-2 transition">How It Works</button>
            <button onClick={() => scrollToSection('developers')} className="block w-full text-left text-[#475569] hover:text-[#FF5C5C] font-medium py-2 transition">Team</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left text-[#475569] hover:text-[#FF5C5C] font-medium py-2 transition">FAQ</button>
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-center">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-center">Log In</Link>
                  <Link to="/register" className="btn-primary text-center">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-6 md:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#FFFBEB] border border-[#FED7AA] text-[#172033] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-6">
                <Sparkles size={14} className="text-[#FF5C5C]" />
                Diving Deeply Into Daily Goals
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#172033] leading-[1.1] tracking-tight mb-6">
                Study Smarter.
                <br />
                <span className="text-[#172554]">Stay Locked In.</span>
                <br />
                <span className="text-[#FF5C5C]">Master Every Goal.</span>
              </h1>

              <p className="text-[#64748B] text-lg md:text-xl mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Daydive pairs an intelligent AI study assistant with real-time focus coaching and behavioral analytics—helping you turn scattered hours into measurable daily progress.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 text-base px-8 py-3.5">
                  Start Diving Free <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-base px-8 py-3.5"
                >
                  See How It Works
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-[#E2E8F0] grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-xl font-extrabold text-[#172554]">RAG AI</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Grounded in your notes</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#FF5C5C]">MindGuard</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Context-aware focus</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#22C55E]">Analytics</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Clear habit telemetry</div>
                </div>
              </div>
            </div>

            {/* Live Product Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#172554] rounded-[24px] p-6 shadow-hover text-white border border-[#1E3A8A]">
                <div className="flex items-center justify-between pb-4 border-b border-[#1E3A8A]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                    <span className="text-xs font-semibold tracking-wide text-[#DBEAFE] uppercase">Live Study Session</span>
                  </div>
                  <span className="text-xs font-semibold bg-[#FFD166] text-[#172033] px-2.5 py-0.5 rounded-full">
                    AI Active
                  </span>
                </div>

                <div className="mt-5 bg-[#1E3A8A]/70 rounded-2xl p-4 border border-[#3B82F6]/20">
                  <div className="text-xs text-[#93C5FD] font-medium">Current Goal</div>
                  <div className="text-base font-bold text-white mt-1">Complete Linked Lists &amp; Trees</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#DBEAFE] flex items-center gap-1.5">
                      <Clock size={14} className="text-[#FF8A65]" /> 42:15 remaining
                    </span>
                    <span className="text-[#22C55E] font-semibold">94% Focus Score</span>
                  </div>
                  <div className="w-full h-2 bg-[#172554] rounded-full mt-2.5 overflow-hidden">
                    <div className="w-[78%] h-full bg-[#FF5C5C] rounded-full" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 text-[#172033]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                      <Shield size={14} className="text-[#22C55E]" /> MindGuard
                    </div>
                    <div className="text-sm font-bold text-[#172554] mt-1.5">On-Goal Activity</div>
                    <div className="text-xs text-[#64748B] mt-0.5">LeetCode &amp; PDF Notes</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-[#172033]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                      <MessageSquare size={14} className="text-[#FF5C5C]" /> AI Tutor
                    </div>
                    <div className="text-sm font-bold text-[#172554] mt-1.5">12 Flashcards</div>
                    <div className="text-xs text-[#64748B] mt-0.5">Generated from Page 4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-16 px-6 md:px-8 bg-white border-y border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">The Problem</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2 mb-4">
              The Internet Helps Us Study. <br className="hidden sm:block" />
              <span className="text-[#172554]">It Also Pulls Us Off Course.</span>
            </h2>
            <p className="text-[#64748B] text-lg mx-auto leading-relaxed max-w-2xl">
              You open a lecture video. Recommendations appear. You switch tabs—social feeds,
              random browsing, and <span className="text-[#FF5C5C] font-semibold">30 minutes vanish.</span>
            </p>
            <div className="mt-7 inline-flex items-center gap-3 bg-[#FFF0EB] border border-[#FED7AA] px-6 py-3.5 rounded-card">
              <Zap size={18} className="text-[#FF5C5C] flex-shrink-0" />
              <p className="text-[#172033] text-sm md:text-base font-semibold">
                The problem isn&apos;t the internet—it&apos;s lacking a system that separates deep work from drift.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">Features</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2">Meet Daydive</h2>
              <p className="text-[#64748B] mx-auto mt-2 max-w-2xl">
                One cohesive workspace combining grounded AI learning, live focus protection, and actionable telemetry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: 'Learn Deeper',
                  desc: 'Upload PDFs and notes to generate summaries, flashcards, adaptive quizzes, and page-grounded AI Tutor explanations.',
                  iconBg: 'bg-[#FFF0EB]',
                  iconColor: 'text-[#FF5C5C]',
                  tag: 'RAG Powered',
                },
                {
                  icon: Target,
                  title: 'Stay Focused',
                  desc: 'MindGuard tracks active tabs against your session goal in real time, nudging you back before a detour becomes an hour.',
                  iconBg: 'bg-[#172554]',
                  iconColor: 'text-white',
                  tag: 'Live Coaching',
                },
                {
                  icon: TrendingUp,
                  title: 'Improve Daily',
                  desc: 'Deterministic focus scores, distraction timelines, and session reports reveal exactly when and how you study best.',
                  iconBg: 'bg-[#ECFDF5]',
                  iconColor: 'text-[#22C55E]',
                  tag: 'Clear Metrics',
                },
              ].map((feature, i) => (
                <div key={i} className="card p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center`}>
                        <feature.icon className={feature.iconColor} size={26} />
                      </div>
                      <span className="text-xs font-semibold text-[#172554] bg-[#FFF8F5] border border-[#FED7AA] px-3 py-1 rounded-full">
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#172033] mb-2.5">{feature.title}</h3>
                    <p className="text-[#64748B] text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-6 md:px-8 bg-[#FFF2EB]/70 border-y border-[#FED7AA]/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">Process</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2">How Daydive Works</h2>
              <p className="text-[#64748B] mx-auto mt-2 max-w-xl">
                Five simple steps from setting a daily goal to building lasting focus habits.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3.5">
                {[
                  { num: '01', title: 'Set Your Daily Goal', desc: 'Define a clear target like "Complete Linked Lists in 60 minutes."' },
                  { num: '02', title: 'Start Studying', desc: 'Use YouTube lectures, LeetCode, documentation, or your uploaded PDFs.' },
                  { num: '03', title: 'Daydive Understands Context', desc: 'MindGuard distinguishes goal-aligned study from off-topic browsing.' },
                  { num: '04', title: 'Stay Locked In', desc: 'Receive timely, context-aware nudges the moment your focus drifts.' },
                  { num: '05', title: 'Review & Improve', desc: 'Inspect your focus score, timeline, and AI takeaways after every session.' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white rounded-card p-4 border border-[#E2E8F0] shadow-card hover:border-[#FED7AA] transition">
                    <div className="w-9 h-9 rounded-xl bg-[#172554] text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step.num}
                    </div>
                    <div>
                      <div className="font-bold text-[#172033]">{step.title}</div>
                      <div className="text-[#64748B] text-sm mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-5">
                <div className="bg-[#172554] text-white rounded-[22px] p-8 shadow-hover border border-[#1E3A8A]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#FF5C5C] flex items-center justify-center">
                      <Layers size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#93C5FD]">Continuous Loop</div>
                      <div className="text-lg font-bold">The Daydive Focus Engine</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                    {PIPELINE_STEPS.map((item, idx) => {
                      const StepIcon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2.5 bg-[#1E3A8A]/80 border border-[#3B82F6]/20 rounded-xl px-3.5 py-2.5"
                        >
                          <StepIcon size={16} className="text-[#FF8A65] flex-shrink-0" />
                          <span className="text-sm font-semibold text-white">{idx + 1}. {item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#1E3A8A] flex items-center justify-between text-xs text-[#DBEAFE]">
                    <span>Goal-aligned telemetry</span>
                    <span className="text-[#22C55E] font-semibold">Real-time sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Different */}
        <section className="py-20 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">Why Daydive</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2">Built Around Intent, Not Rigid Blocks</h2>
              <p className="text-[#64748B] mx-auto mt-3 max-w-2xl">
                Daydive doesn&apos;t just ask <span className="text-[#94A3B8] line-through">&quot;Which websites should I block?&quot;</span>
                <br />
                It asks <span className="text-[#172554] font-semibold">&quot;Is this activity moving you closer to today&apos;s goal?&quot;</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { bad: 'Blindly blocks websites', good: 'Understands study context' },
                { bad: 'Scattered learning tools', good: 'Unified AI + focus workspace' },
                { bad: 'Tracks raw hours only', good: 'Analyzes focus behavior' },
                { bad: 'Generic timer alerts', good: 'Context-aware interventions' },
                { bad: 'Standalone AI chatbot', good: 'Material-grounded AI tutor' },
                { bad: 'Surface-level stats', good: 'Actionable habit insights' },
              ].map((item, i) => (
                <div key={i} className="card p-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#64748B] text-sm line-through">
                    <XCircle size={16} className="text-[#94A3B8] flex-shrink-0" />
                    {item.bad}
                  </span>
                  <ArrowRight className="text-[#FF5C5C] flex-shrink-0" size={16} />
                  <span className="inline-flex items-center gap-2 text-[#172033] text-sm font-semibold text-right">
                    <CheckCircle2 size={16} className="text-[#22C55E] flex-shrink-0" />
                    {item.good}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developers / Team */}
        <section id="developers" className="py-20 px-6 md:px-8 bg-[#FFF2EB]/70 border-y border-[#FED7AA]/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">The Team</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2">Meet the Developers</h2>
              <p className="text-[#64748B] mx-auto mt-2 max-w-2xl">
                Four engineers on one mission—building a study companion that genuinely understands how students work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEVELOPERS.map((dev, i) => {
                const Icon = dev.icon;
                return (
                  <div key={i} className="card p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 ${dev.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={dev.iconColor} size={26} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-[#172033]">{dev.name}</h3>
                        <p className="text-[#FF5C5C] text-sm font-semibold">{dev.role}</p>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {dev.points.map((p, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[#475569] text-sm leading-relaxed">
                          <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${dev.dotColor}`} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 md:px-8 bg-[#172554] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FFD166] mb-3">
              Diving Deeply Into Daily Goals
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to Take Control of Your Study Sessions?
            </h2>
            <p className="text-[#DBEAFE] mb-8 text-lg max-w-2xl mx-auto">
              Start learning with Daydive and turn every study block into focused, measurable progress.
            </p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#FF5C5C] uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#172033] mt-2">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4"
                    >
                      <span className="font-bold text-[#172033]">{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-[#FF5C5C] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-[#64748B] text-sm leading-relaxed border-t border-[#E2E8F0]/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white py-10 px-6 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[#64748B] text-sm">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <span className="hidden sm:inline text-[#64748B]">— Diving deeply into daily goals</span>
            </div>
            <div className="flex gap-6 font-medium">
              <button onClick={() => scrollToSection('features')} className="hover:text-[#172554] transition">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#172554] transition">How It Works</button>
              <button onClick={() => scrollToSection('developers')} className="hover:text-[#172554] transition">Team</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-[#172554] transition">FAQ</button>
            </div>
            <div>© 2026 Daydive</div>
          </div>
        </footer>
      </main>
    </div>
  );
}