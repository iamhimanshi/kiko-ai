import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Target, 
  BarChart3, 
  Shield, 
  Zap,
  BookOpen,
  Eye,
  Clock,
  TrendingUp,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-cream">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-white/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-xl font-bold text-primary">KIKO</span>
            <span className="text-xs font-medium text-gold bg-gold-bg px-2 py-0.5 rounded-full">AI</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-text-slate">
            <button onClick={() => scrollToSection('features')} className="hover:text-primary transition">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary transition">How It Works</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-primary transition">FAQ</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-text-slate hover:text-primary px-3 py-2 text-sm font-medium transition">
                  Log In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-text-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-bg-white border-b border-border/50 px-6 py-4 space-y-3">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left text-text-slate hover:text-primary py-2 transition">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-text-slate hover:text-primary py-2 transition">How It Works</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left text-text-slate hover:text-primary py-2 transition">FAQ</button>
            <div className="pt-3 border-t border-border flex flex-col gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-center">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-text-slate hover:text-primary text-center py-2 transition">Log In</Link>
                  <Link to="/signup" className="btn-primary text-center">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-bg-cream via-bg-sage to-bg-cream">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold-bg border border-gold/30 text-gold px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles size={16} />
              AI-Powered Study Companion
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-dark leading-tight mb-6">
              Study Smarter.
              <br />
              <span className="text-primary">Stay Focused.</span>
              <br />
              <span className="text-gold">Improve Every Session.</span>
            </h1>
            <p className="text-text-slate text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              KIKO AI combines intelligent study assistance with real-time focus coaching
              to help students learn, stay focused, and understand their study habits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3"
              >
                See How It Works
              </button>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-16 px-6 bg-bg-white border-y border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-sm font-semibold text-gold uppercase tracking-wider">The Problem</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mt-2 mb-4">
              The Internet Helps Us Study. <br className="hidden sm:block" />
              <span className="text-primary">It Also Distracts Us.</span>
            </h2>
            <p className="text-text-slate text-lg max-w-2xl mx-auto leading-relaxed">
              You open YouTube for a tutorial. Recommendations appear. You switch tabs.
              Instagram, entertainment, random browsing. <span className="text-primary font-semibold">30 minutes disappear.</span>
            </p>
            <div className="mt-6 inline-block bg-secondary-extraLight px-6 py-3 rounded-card">
              <p className="text-primary font-medium">
                The problem isn't the internet. It's the inability to distinguish productive activity from distraction.
              </p>
            </div>
          </div>
        </section>

        {/* What is KIKO */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-gold uppercase tracking-wider">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-dark mt-2">Meet KIKO AI</h2>
              <p className="text-text-slate max-w-2xl mx-auto mt-2">
                An intelligent study companion that combines learning, focus, and analytics.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: BookOpen, title: 'Learn', desc: 'AI summaries, flashcards, quizzes, and an AI tutor.', iconBg: 'bg-secondary-extraLight', iconColor: 'text-primary' },
                { icon: Target, title: 'Focus', desc: 'Real-time focus monitoring with MindGuard.', iconBg: 'bg-gold-bg', iconColor: 'text-gold' },
                { icon: TrendingUp, title: 'Improve', desc: 'Analytics and AI insights to understand your habits.', iconBg: 'bg-status-successBg', iconColor: 'text-status-success' },
              ].map((feature, i) => (
                <div key={i} className="card p-8 text-center">
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={feature.iconColor} size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-text-dark mb-2">{feature.title}</h3>
                  <p className="text-text-slate text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-6 bg-bg-sage">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-gold uppercase tracking-wider">Process</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-dark mt-2">How KIKO Works</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { num: '01', title: 'Set Your Goal', desc: '"Complete Linked Lists in 60 minutes."' },
                  { num: '02', title: 'Start Studying', desc: 'Use YouTube, LeetCode, documentation, or your notes.' },
                  { num: '03', title: 'KIKO Understands', desc: 'MindGuard identifies relevant vs distracting activity.' },
                  { num: '04', title: 'Stay Focused', desc: 'KIKO provides smart nudges when you drift off-goal.' },
                  { num: '05', title: 'Review & Improve', desc: 'See your session report and AI-generated insights.' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4 bg-bg-white rounded-card p-4 shadow-card">
                    <div className="text-gold font-mono text-sm font-bold min-w-[32px]">{step.num}</div>
                    <div>
                      <div className="font-semibold text-text-dark">{step.title}</div>
                      <div className="text-text-slate text-sm">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card p-8 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-text-slate text-sm font-medium">Plan → Learn → Focus → Detect → Intervene → Analyze → Improve</p>
                <div className="w-full h-1.5 bg-border rounded-full mt-6">
                  <div className="w-full h-full bg-primary rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Different */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-gold uppercase tracking-wider">Why KIKO</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-dark mt-2">What Makes KIKO Different</h2>
              <p className="text-text-slate max-w-2xl mx-auto mt-2">
                KIKO doesn't ask <span className="text-text-muted line-through">"Which websites should I block?"</span><br />
                It asks <span className="text-primary font-semibold">"Is this activity helping me achieve my study goal?"</span>
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { bad: 'Blocks websites', good: 'Understands study context' },
                { bad: 'Separates learning tools', good: 'Combines learning + focus' },
                { bad: 'Tracks time only', good: 'Analyzes behaviour' },
                { bad: 'Generic reminders', good: 'Context-aware interventions' },
                { bad: 'AI chatbot only', good: 'AI + focus coaching' },
                { bad: 'Basic stats', good: 'Study behaviour insights' },
              ].map((item, i) => (
                <div key={i} className="card p-4 flex items-center justify-between">
                  <span className="text-text-muted text-sm line-through">{item.bad}</span>
                  <ArrowRight className="text-gold" size={16} />
                  <span className="text-text-dark text-sm font-medium">{item.good}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-gradient-to-br from-gold-bg to-bg-cream border-y border-gold/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Ready to Take Control of Your Study Sessions?</h2>
            <p className="text-text-slate mb-8 text-lg">Start learning with KIKO AI and turn your study time into focused study time.</p>
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-gold uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mt-2">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'What is KIKO AI?', a: 'KIKO AI is an intelligent study companion that combines AI-powered learning assistance with real-time focus monitoring and study analytics.' },
              { q: 'How does KIKO detect distractions?', a: 'MindGuard analyzes your browsing activity, website context, and study goal to determine if you\'re staying focused or getting distracted.' },
              { q: 'Does KIKO block websites?', a: 'No. KIKO guides you back to focus rather than blocking websites. It understands the difference between educational and distracting content.' },
              { q: 'Can I use YouTube for studying?', a: 'Absolutely. YouTube tutorials are recognized as relevant content when they match your study goal.' },
              { q: 'Is my data secure?', a: 'Yes. All passwords are hashed, APIs are authenticated, and your data belongs only to you.' },
            ].map((faq, i) => (
              <div key={i} className="card p-5">
                <h4 className="font-semibold text-text-dark">{faq.q}</h4>
                <p className="text-text-slate text-sm mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-bg-white py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-text-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">K</span>
              </div>
              <span className="font-bold text-primary">KIKO</span>
              <span className="text-gold">AI</span>
              <span className="ml-2 text-text-muted">— Kickstart Your Focus Era</span>
            </div>
            <div className="flex gap-6">
              <button onClick={() => scrollToSection('features')} className="hover:text-primary transition">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary transition">How It Works</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-primary transition">FAQ</button>
            </div>
            <div>© 2026 KIKO AI</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
