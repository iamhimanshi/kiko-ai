import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ArrowLeft, Plus, X, Clock, Target, BookOpen, Sparkles, Zap, Coffee } from 'lucide-react';

const DURATION_OPTIONS = [25, 45, 60, 90];

export default function SessionSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    duration: 60,
    customDuration: '',
    tasks: [''],
    mode: 'continuous',
    workDuration: 25,
    breakDuration: 5,
  });
  const [error, setError] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTaskChange = (index, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => setFormData({ ...formData, tasks: [...formData.tasks, ''] });

  const removeTask = (index) => {
    if (formData.tasks.length === 1) return;
    setFormData({ ...formData, tasks: formData.tasks.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.subject.trim()) return setError('Please enter a subject.');
    if (!formData.goal.trim()) return setError('Please enter a study goal.');

    const finalDuration = useCustom ? parseInt(formData.customDuration, 10) : formData.duration;
    if (!finalDuration || finalDuration < 1 || finalDuration > 480) {
      return setError('Duration must be between 1 and 480 minutes.');
    }

    const cleanedTasks = formData.tasks.map((t) => t.trim()).filter((t) => t.length > 0);
    const payload = {
      subject: formData.subject.trim(),
      goal: formData.goal.trim(),
      duration_minutes: finalDuration,
      tasks: cleanedTasks,
      mode: formData.mode,
    };

    if (formData.mode === 'pomodoro') {
      payload.work_duration_minutes = parseInt(formData.workDuration, 10) || 25;
      payload.break_duration_minutes = parseInt(formData.breakDuration, 10) || 5;
    }

    navigate('/study-session/preview', { state: payload });
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#8E8E93] hover:text-white font-medium transition mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="card p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#261A10] border border-[#FF841C]/40 rounded-xl flex items-center justify-center">
                <Target className="text-[#FF841C]" size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Start a Study Session</h1>
            </div>
            <p className="text-[#8E8E93] mb-6 text-sm">Plan your next focused block and set clear daily goals.</p>

            {error && (
              <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-5 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-white text-sm font-semibold mb-1.5">Subject</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={18} />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="e.g., Data Structures & Algorithms"
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-white text-sm font-semibold mb-1.5">What do you want to accomplish?</label>
                <div className="relative">
                  <Target className="absolute left-4 top-4 text-[#8E8E93]" size={18} />
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    rows={2}
                    className="input-field pl-11 resize-none"
                    placeholder="e.g., Complete Linked Lists and solve 5 problems"
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-white text-sm font-semibold mb-1.5">Total Duration</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {DURATION_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => { setFormData({ ...formData, duration: min }); setUseCustom(false); }}
                      className={`py-2.5 rounded-[14px] text-sm font-semibold transition ${
                        !useCustom && formData.duration === min
                          ? 'bg-[#E66A10] text-white'
                          : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white hover:border-[#FF841C]/50'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`w-full py-2.5 rounded-[14px] text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    useCustom
                      ? 'bg-[#E66A10] text-white'
                      : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white hover:border-[#FF841C]/50'
                  }`}
                >
                  <Clock size={16} />
                  Custom Duration
                </button>
                {useCustom && (
                  <input
                    type="number"
                    name="customDuration"
                    value={formData.customDuration}
                    onChange={handleChange}
                    min="1"
                    max="480"
                    className="input-field mt-2"
                    placeholder="Enter minutes (1–480)"
                  />
                )}
              </div>

              <div className="mb-5">
                <label className="block text-white text-sm font-semibold mb-1.5">Study Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'continuous' })}
                    className={`py-3 rounded-[14px] text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      formData.mode === 'continuous'
                        ? 'bg-[#E66A10] text-white'
                        : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white hover:border-[#FF841C]/50'
                    }`}
                  >
                    <Zap size={16} />
                    Continuous
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'pomodoro' })}
                    className={`py-3 rounded-[14px] text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      formData.mode === 'pomodoro'
                        ? 'bg-[#E66A10] text-white'
                        : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white hover:border-[#FF841C]/50'
                    }`}
                  >
                    <Coffee size={16} />
                    Pomodoro
                  </button>
                </div>
                <p className="text-[#8E8E93] text-xs mt-2">
                  {formData.mode === 'continuous'
                    ? 'Focus for the full duration without breaks.'
                    : 'Alternate between focus sprints and short breaks.'}
                </p>
              </div>

              {formData.mode === 'pomodoro' && (
                <div className="mb-5 bg-[#261A10] border border-[#FF841C]/30 rounded-[14px] p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white text-xs font-semibold mb-1.5">Focus interval (min)</label>
                      <input type="number" name="workDuration" value={formData.workDuration} onChange={handleChange} min="1" max="120" className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white text-xs font-semibold mb-1.5">Break interval (min)</label>
                      <input type="number" name="breakDuration" value={formData.breakDuration} onChange={handleChange} min="1" max="60" className="input-field py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-1.5">
                  Tasks <span className="text-[#8E8E93] font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => handleTaskChange(index, e.target.value)}
                        className="input-field py-2.5 text-sm flex-1"
                        placeholder={`Task ${index + 1}`}
                      />
                      {formData.tasks.length > 1 && (
                        <button type="button" onClick={() => removeTask(index)} className="text-[#8E8E93] hover:text-[#FF841C] p-2 rounded-lg transition">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addTask} className="text-[#FF841C] hover:text-white text-sm font-semibold transition flex items-center gap-1 mt-3">
                  <Plus size={16} />
                  Add Task
                </button>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                <Sparkles size={18} />
                Continue to Preview
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

