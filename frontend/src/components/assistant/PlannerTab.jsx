import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { plannerApi } from '../../services/api';
import {
  Calendar, Plus, CheckCircle, Circle, Clock, Target, Trash2,
  Play, Loader2, BookOpen, Layers, History, X, Sparkles, Check,
} from 'lucide-react';

const SUB_VIEWS = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'tasks', label: 'Task Manager', icon: CheckCircle },
  { id: 'insights', label: 'AI Recommendations', icon: Sparkles },
  { id: 'create', label: 'Create Plan', icon: Plus },
  { id: 'history', label: 'History', icon: History },
];

const EMPTY_SUBJECT = {
  name: '',
  difficulty: 'medium',
  priority: 3,
  prep_level: 'beginner',
  topicsText: '',
};

export default function PlannerTab() {
  const navigate = useNavigate();
  const [subView, setSubView] = useState('overview');
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [recData, setRecData] = useState({ metrics: null, recommendations: [] });
  const [analyzing, setAnalyzing] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentPreview, setAgentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [dailyHours, setDailyHours] = useState(3);
  const [blockMinutes, setBlockMinutes] = useState(45);
  const [subjects, setSubjects] = useState([{ ...EMPTY_SUBJECT }]);
  const [creating, setCreating] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actRes, listRes, recRes] = await Promise.all([
        plannerApi.getActivePlan(),
        plannerApi.listPlans(),
        plannerApi.getRecommendations().catch(() => ({ data: { metrics: null, recommendations: [] } })),
      ]);
      setPlan(actRes.data?.plan || null);
      setHistory(listRes.data || []);
      setRecData(recRes.data || { metrics: null, recommendations: [] });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load study planner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await plannerApi.analyzeBehavior();
      setRecData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not analyze study behaviour.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    if (!agentInput.trim() || agentLoading) return;
    setAgentLoading(true);
    setError('');
    try {
      const res = await plannerApi.sendAgentCommand(agentInput.trim());
      setAgentPreview(res.data);
      setAgentInput('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Planner Agent could not process that request.');
    } finally {
      setAgentLoading(false);
    }
  };

  const handleConfirmAgent = async () => {
    if (!agentPreview) return;
    setAgentLoading(true);
    try {
      await plannerApi.confirmAgentAction(agentPreview.intent, agentPreview.params || {});
      setAgentPreview(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not apply schedule change.');
    } finally {
      setAgentLoading(false);
    }
  };

  const handleApplyRec = async (recId) => {
    try {
      await plannerApi.applyRecommendation(recId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not apply recommendation.');
    }
  };

  const handleDismissRec = async (recId) => {
    try {
      await plannerApi.dismissRecommendation(recId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not dismiss recommendation.');
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await plannerApi.updateTaskStatus(task.id, nextStatus);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update task.');
    }
  };

  const handleReschedule = async (taskId, newDate) => {
    if (!newDate) return;
    try {
      await plannerApi.rescheduleTask(taskId, newDate);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reschedule task.');
    }
  };

  const handleStartSession = (task) => {
    navigate('/study-session/preview', {
      state: {
        subject: task.subject_name,
        goal: task.title,
        duration_minutes: task.duration_minutes,
        tasks: [task.title],
        mode: 'continuous',
      },
    });
  };

  const handleAddSubject = () => setSubjects([...subjects, { ...EMPTY_SUBJECT }]);

  const handleRemoveSubject = (idx) => {
    if (subjects.length === 1) return;
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx, field, val) => {
    const next = [...subjects];
    next[idx] = { ...next[idx], [field]: val };
    setSubjects(next);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setError('');
    const validSubjects = subjects.filter((s) => s.name.trim());
    if (!title.trim() || !goal.trim() || validSubjects.length === 0) {
      setError('Please enter a plan title, goal, and at least one subject.');
      return;
    }

    setCreating(true);
    try {
      await plannerApi.createPlan({
        title: title.trim(),
        goal: goal.trim(),
        exam_date: examDate,
        daily_hours: Number(dailyHours),
        preferred_block_minutes: Number(blockMinutes),
        subjects: validSubjects.map((s) => ({
          name: s.name.trim(),
          difficulty: s.difficulty,
          priority: Number(s.priority),
          prep_level: s.prep_level,
          topics: s.topicsText.split(',').map((t) => t.trim()).filter(Boolean),
        })),
      });
      setTitle('');
      setGoal('');
      setSubjects([{ ...EMPTY_SUBJECT }]);
      await loadData();
      setSubView('overview');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create study plan.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this study plan?')) return;
    try {
      await plannerApi.deletePlan(planId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete plan.');
    }
  };

  const todayTasks = useMemo(
    () => (plan?.tasks || []).filter((t) => t.scheduled_date === todayIso),
    [plan, todayIso]
  );

  const overdueTasks = useMemo(
    () => (plan?.tasks || []).filter((t) => t.is_overdue),
    [plan]
  );

  const filteredTasks = useMemo(() => {
    const all = plan?.tasks || [];
    if (taskFilter === 'today') return all.filter((t) => t.scheduled_date === todayIso);
    if (taskFilter === 'pending') return all.filter((t) => t.status === 'pending');
    if (taskFilter === 'completed') return all.filter((t) => t.status === 'completed');
    if (taskFilter === 'overdue') return all.filter((t) => t.is_overdue);
    return all;
  }, [plan, taskFilter, todayIso]);

  const scheduleByDate = useMemo(() => {
    const map = {};
    (plan?.tasks || []).forEach((t) => {
      if (!map[t.scheduled_date]) map[t.scheduled_date] = [];
      map[t.scheduled_date].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [plan]);

  const pendingRecs = (recData.recommendations || []).filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {SUB_VIEWS.map((v) => {
            const Icon = v.icon;
            const active = subView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSubView(v.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition ${
                  active
                    ? 'bg-[#E66A10] text-white'
                    : 'bg-[#1A1A1A] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
                }`}
              >
                <Icon size={14} />
                {v.label}
                {v.id === 'insights' && pendingRecs.length > 0 && (
                  <span className="bg-[#121212] text-[#FF841C] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingRecs.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}><X size={15} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#8E8E93] gap-2">
          <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading study planner...
        </div>
      ) : subView === 'create' ? (
        <form onSubmit={handleCreatePlan} className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Create Adaptive Study Plan</h2>
            <p className="text-[#8E8E93] text-xs mt-0.5">
              Define your goal, exam date, daily capacity, and subjects. DayDive schedules your blocks automatically.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Plan Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Semester 6 Finals" className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Exam / Target Date</label>
              <input type="date" min={todayIso} value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input-field text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">Primary Goal</label>
            <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Complete all core units and solve past papers before finals" className="input-field text-sm" required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Daily Available Study Hours</label>
              <input type="number" step="0.5" min="0.5" max="14" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Preferred Block Length (min)</label>
              <input type="number" min="15" max="120" step="5" value={blockMinutes} onChange={(e) => setBlockMinutes(e.target.value)} className="input-field text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">Subjects</label>
              <button type="button" onClick={handleAddSubject} className="text-[#FF841C] text-xs font-semibold hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Subject
              </button>
            </div>

            {subjects.map((s, idx) => (
              <div key={idx} className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input type="text" value={s.name} onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)} placeholder={`Subject ${idx + 1} (e.g., DBMS)`} className="input-field py-2 text-sm flex-1" required />
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => handleRemoveSubject(idx)} className="text-[#8E8E93] hover:text-[#EF4444] p-2">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <select value={s.difficulty} onChange={(e) => handleSubjectChange(idx, 'difficulty', e.target.value)} className="input-field py-2 text-xs">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select value={s.priority} onChange={(e) => handleSubjectChange(idx, 'priority', Number(e.target.value))} className="input-field py-2 text-xs">
                    <option value={5}>Priority 5 (Highest)</option>
                    <option value={4}>Priority 4 (High)</option>
                    <option value={3}>Priority 3 (Normal)</option>
                    <option value={2}>Priority 2 (Low)</option>
                    <option value={1}>Priority 1 (Lowest)</option>
                  </select>
                  <select value={s.prep_level} onChange={(e) => handleSubjectChange(idx, 'prep_level', e.target.value)} className="input-field py-2 text-xs">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <input type="text" value={s.topicsText} onChange={(e) => handleSubjectChange(idx, 'topicsText', e.target.value)} placeholder="Topics separated by commas (e.g., Normalization, Indexing, Transactions)" className="input-field py-2 text-xs" />
              </div>
            ))}
          </div>

          <button type="submit" disabled={creating} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {creating ? <><Loader2 size={16} className="animate-spin" /> Generating Schedule...</> : 'Generate Study Plan'}
          </button>
        </form>
      ) : subView === 'history' ? (
        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">Planning History</h2>
          {history.length === 0 ? (
            <p className="text-[#8E8E93] text-sm">No study plans created yet.</p>
          ) : (
            history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.status === 'active' ? 'bg-[#0F2922] text-[#10B981]' : 'bg-[#1A1A1A] text-[#8E8E93]'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[#8E8E93] text-xs mt-0.5">
                    Target: {p.exam_date} · {p.completed_tasks}/{p.total_tasks} tasks ({p.completion_rate}%)
                  </p>
                </div>
                <button type="button" onClick={() => handleDeletePlan(p.id)} className="text-[#8E8E93] hover:text-[#EF4444] p-2">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : !plan ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-[#FF841C]" size={26} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Study Plan</h3>
          <p className="text-[#8E8E93] text-sm max-w-md mx-auto mb-6">
            Tell DayDive your subjects, exam date, and daily study hours to generate a realistic, adaptive daily schedule.
          </p>
          <button type="button" onClick={() => setSubView('create')} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create Study Plan
          </button>
        </div>
      ) : subView === 'insights' ? (
        <div className="space-y-6">
          <div className="card p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#FF841C]" /> Behaviour-Aware Recommendations
              </h2>
              <p className="text-[#8E8E93] text-xs mt-1">
                DayDive analyzes your actual Study Session durations, distractions, and deadlines to adapt upcoming tasks.
              </p>
            </div>
            <button type="button" onClick={handleAnalyze} disabled={analyzing} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
              {analyzing ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Sparkles size={14} /> Run Behaviour Analysis</>}
            </button>
          </div>

          {recData.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-[#8E8E93] text-xs">Sessions Analyzed</p>
                <p className="text-xl font-extrabold text-white mt-1">{recData.metrics.sessions_analyzed ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-[#8E8E93] text-xs">Avg Duration Ratio</p>
                <p className="text-xl font-extrabold text-white mt-1">{Math.round((recData.metrics.avg_completion_ratio ?? 1) * 100)}%</p>
              </div>
              <div className="card p-4">
                <p className="text-[#8E8E93] text-xs">Avg Distractions</p>
                <p className="text-xl font-extrabold text-[#FF841C] mt-1">{recData.metrics.avg_distractions ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-[#8E8E93] text-xs">Peak Focus Window</p>
                <p className="text-xl font-extrabold text-[#10B981] mt-1 capitalize">{recData.metrics.peak_time_slot || 'evening'}</p>
              </div>
            </div>
          )}

          {pendingRecs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-white font-semibold text-sm">No pending recommendations</p>
              <p className="text-[#8E8E93] text-xs mt-1">Click &quot;Run Behaviour Analysis&quot; to check your latest study patterns.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRecs.map((r) => (
                <div key={r.id} className="bg-gradient-to-br from-[#2B1D12] via-[#1F1711] to-[#1A1A1A] border border-[#FF841C]/35 rounded-[18px] p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#261A10] text-[#FF841C] px-2.5 py-0.5 rounded-full">
                      {r.action_type.replace('_', ' ')}
                    </span>
                    <p className="text-white font-semibold text-sm mt-2">{r.observation}</p>
                    <p className="text-[#D1D5DB] text-xs mt-1 leading-relaxed">{r.suggestion}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {r.action_type !== 'tip' && (
                      <button type="button" onClick={() => handleApplyRec(r.id)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                        <Check size={14} /> Apply to Schedule
                      </button>
                    )}
                    <button type="button" onClick={() => handleDismissRec(r.id)} className="btn-secondary text-xs px-4 py-2">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : subView === 'overview' ? (
        <div className="space-y-6">
          {/* Conversational Planner Agent */}
          <div className="card p-5 space-y-3">
            <form onSubmit={handleAgentSubmit} className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder='Ask Planner Agent (e.g., "I could not finish today’s tasks, reschedule them")'
                className="input-field flex-1 min-w-[220px] py-2.5 text-sm"
              />
              <button type="submit" disabled={agentLoading || !agentInput.trim()} className="btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 disabled:opacity-50">
                {agentLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Ask Agent
              </button>
            </form>

            {agentPreview && (
              <div className="bg-[#261A10] border border-[#FF841C]/40 rounded-[14px] p-4 space-y-3">
                <p className="text-white text-sm font-medium">{agentPreview.summary}</p>
                {agentPreview.requires_confirmation ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#8E8E93] mr-2">
                      Affects {agentPreview.affected_tasks} pending task(s)
                    </span>
                    <button type="button" onClick={handleConfirmAgent} disabled={agentLoading} className="btn-primary text-xs px-4 py-1.5">
                      Confirm Changes
                    </button>
                    <button type="button" onClick={() => setAgentPreview(null)} className="btn-secondary text-xs px-4 py-1.5">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAgentPreview(null)} className="btn-secondary text-xs px-3 py-1">
                    Got it
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-[#8E8E93] text-xs font-medium">Active Plan</p>
              <p className="text-lg font-extrabold text-white mt-1 truncate">{plan.title}</p>
              <p className="text-[#FF841C] text-xs font-semibold mt-1">{plan.days_left} days left</p>
            </div>
            <div className="card p-5">
              <p className="text-[#8E8E93] text-xs font-medium">Completion</p>
              <p className="text-2xl font-extrabold text-white mt-1">{plan.completion_rate}%</p>
              <p className="text-[#8E8E93] text-xs mt-1">{plan.completed_tasks} of {plan.total_tasks} tasks</p>
            </div>
            <div className="card p-5">
              <p className="text-[#8E8E93] text-xs font-medium">Today&apos;s Load</p>
              <p className="text-2xl font-extrabold text-white mt-1">{todayTasks.length}</p>
              <p className="text-[#8E8E93] text-xs mt-1">{todayTasks.reduce((s, t) => s + t.duration_minutes, 0)} min scheduled</p>
            </div>
            <div className="card p-5">
              <p className="text-[#8E8E93] text-xs font-medium">Overdue</p>
              <p className={`text-2xl font-extrabold mt-1 ${overdueTasks.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {overdueTasks.length}
              </p>
              <p className="text-[#8E8E93] text-xs mt-1">{overdueTasks.length > 0 ? 'Needs rescheduling' : 'On track'}</p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={17} className="text-[#FF841C]" /> Today&apos;s Study Blocks
              </h3>
              <button type="button" onClick={() => setSubView('schedule')} className="text-[#FF841C] text-xs font-semibold hover:underline">
                Full Schedule
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <p className="text-[#8E8E93] text-sm py-4">No tasks scheduled for today.</p>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3.5 bg-[#232325] border border-[#2E2E32] rounded-[14px]">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button type="button" onClick={() => handleToggleTask(t)} className="flex-shrink-0">
                        {t.status === 'completed' ? <CheckCircle size={18} className="text-[#10B981]" /> : <Circle size={18} className="text-[#8E8E93] hover:text-[#FF841C]" />}
                      </button>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.subject_color }} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${t.status === 'completed' ? 'line-through text-[#8E8E93]' : 'text-white'}`}>
                          {t.title}
                        </p>
                        <p className="text-xs text-[#8E8E93]">{t.subject_name} · {t.duration_minutes} min</p>
                      </div>
                    </div>

                    {t.status !== 'completed' && (
                      <button type="button" onClick={() => handleStartSession(t)} className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 flex-shrink-0">
                        <Play size={12} fill="currentColor" /> Start
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : subView === 'schedule' ? (
        <div className="space-y-4">
          {scheduleByDate.map(([dateStr, dayTasks]) => (
            <div key={dateStr} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">
                  {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {dateStr === todayIso && <span className="ml-2 text-[10px] bg-[#E66A10] text-white px-2 py-0.5 rounded-full">Today</span>}
                </h3>
                <span className="text-xs text-[#8E8E93]">{dayTasks.reduce((s, t) => s + t.duration_minutes, 0)} min total</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dayTasks.map((t) => (
                  <div key={t.id} className="bg-[#232325] border border-[#2E2E32] rounded-[12px] p-3 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subject_color }}>
                          {t.subject_name}
                        </span>
                        <p className={`text-xs font-semibold ${t.status === 'completed' ? 'line-through text-[#8E8E93]' : 'text-white'}`}>
                          {t.title}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleToggleTask(t)}>
                        {t.status === 'completed' ? <CheckCircle size={15} className="text-[#10B981]" /> : <Circle size={15} className="text-[#8E8E93]" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#2E2E32] text-[11px] text-[#8E8E93]">
                      <span className="flex items-center gap-1"><Clock size={11} /> {t.duration_minutes}m</span>
                      <input type="date" value={t.scheduled_date} onChange={(e) => handleReschedule(t.id, e.target.value)} className="bg-transparent text-[#8E8E93] text-[10px] focus:outline-none cursor-pointer" title="Reschedule date" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-white">Task Manager</h2>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'today', 'pending', 'completed', 'overdue'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTaskFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                    taskFilter === f ? 'bg-[#E66A10] text-white' : 'bg-[#232325] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-[#8E8E93] text-sm py-6 text-center">No tasks match this filter.</p>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3.5 bg-[#232325] border border-[#2E2E32] rounded-[12px]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button type="button" onClick={() => handleToggleTask(t)}>
                      {t.status === 'completed' ? <CheckCircle size={17} className="text-[#10B981]" /> : <Circle size={17} className="text-[#8E8E93]" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${t.status === 'completed' ? 'line-through text-[#8E8E93]' : 'text-white'}`}>
                        {t.title}
                      </p>
                      <p className="text-xs text-[#8E8E93]">
                        {t.subject_name} · {t.scheduled_date} · {t.duration_minutes}m
                        {t.is_overdue && <span className="text-[#EF4444] ml-2 font-semibold">Overdue</span>}
                      </p>
                    </div>
                  </div>
                  {t.status !== 'completed' && (
                    <button type="button" onClick={() => handleStartSession(t)} className="btn-secondary px-3 py-1.5 text-xs">
                      Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}