import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  ArrowLeft,
  Plus,
  X,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

const DURATION_OPTIONS = [25, 45, 60, 90];

export default function SessionSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    duration: 60,
    customDuration: '',
    tasks: [''],
  });
  const [error, setError] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTaskChange = (index, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => {
    setFormData({ ...formData, tasks: [...formData.tasks, ''] });
  };

  const removeTask = (index) => {
    if (formData.tasks.length === 1) return;
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!formData.goal.trim()) {
      setError('Please enter a study goal.');
      return;
    }

    const finalDuration = useCustom
      ? parseInt(formData.customDuration, 10)
      : formData.duration;

    if (!finalDuration || finalDuration < 1 || finalDuration > 480) {
      setError('Duration must be between 1 and 480 minutes.');
      return;
    }

    const cleanedTasks = formData.tasks
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Navigate to preview with session data
    navigate('/study-session/preview', {
      state: {
        subject: formData.subject.trim(),
        goal: formData.goal.trim(),
        duration_minutes: finalDuration,
        tasks: cleanedTasks,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1B4332] rounded-xl flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Start a Study Session</h1>
            </div>
            <p className="text-[#4B5563] mb-6 text-sm">
              Set your goal, break it into tasks, and stay focused.
            </p>

            {error && (
              <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Subject */}
              <div className="mb-5">
                <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
                  Subject
                </label>
                <div className="relative">
                  <BookOpen
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    size={18}
                  />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-11 pr-4 py-3 text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    placeholder="e.g., Data Structures & Algorithms"
                    required
                  />
                </div>
              </div>

              {/* Goal */}
              <div className="mb-5">
                <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
                  Study Goal
                </label>
                <div className="relative">
                  <Target
                    className="absolute left-4 top-4 text-[#9CA3AF]"
                    size={18}
                  />
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-11 pr-4 py-3 text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all resize-none"
                    placeholder="e.g., Complete Linked Lists and solve 5 problems"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {DURATION_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, duration: min });
                        setUseCustom(false);
                      }}
                      className={`py-2.5 rounded-[14px] text-sm font-medium transition ${
                        !useCustom && formData.duration === min
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`w-full py-2.5 rounded-[14px] text-sm font-medium transition flex items-center justify-center gap-2 ${
                    useCustom
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                  }`}
                >
                  <Clock size={16} />
                  Custom Duration
                </button>
                {useCustom && (
                  <div className="relative mt-2">
                    <input
                      type="number"
                      name="customDuration"
                      value={formData.customDuration}
                      onChange={handleChange}
                      min="1"
                      max="480"
                      className="w-full bg-white border border-[#E8ECE7] rounded-[14px] px-4 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                      placeholder="Enter minutes (1–480)"
                    />
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="mb-6">
                <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
                  Tasks <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <div className="space-y-2">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => handleTaskChange(index, e.target.value)}
                        className="flex-1 bg-white border border-[#E8ECE7] rounded-[14px] px-4 py-2.5 text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all text-sm"
                        placeholder={`Task ${index + 1}`}
                      />
                      {formData.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="text-[#9CA3AF] hover:text-[#D14343] p-2 rounded-lg transition"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTask}
                  className="text-[#1B4332] hover:text-[#24543F] text-sm font-medium transition flex items-center gap-1 mt-3"
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1B4332] hover:bg-[#24543F] text-white font-semibold py-3.5 rounded-[14px] transition flex items-center justify-center gap-2"
              >
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
