import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Clock, Target, BookOpen, CheckCircle } from 'lucide-react';

export default function SessionSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    duration: 60,
    tasks: [''],
  });

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
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Call API to create session
    navigate('/study-session/active');
  };

  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="max-w-2xl mx-auto p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-text-dark">Start a Study Session</h1>
          </div>
          <p className="text-text-slate mb-6">Set your goal and focus on what matters.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-text-slate text-sm font-medium mb-1.5">Subject</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder" size={18} />
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
              <label className="block text-text-slate text-sm font-medium mb-1.5">Study Goal</label>
              <div className="relative">
                <Target className="absolute left-4 top-4 text-text-placeholder" size={18} />
                <input
                  type="text"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="input-field pl-11"
                  placeholder="e.g., Study Linked Lists and solve 5 problems"
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-text-slate text-sm font-medium mb-1.5">Duration</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder" size={18} />
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input-field pl-11 appearance-none"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-text-slate text-sm font-medium mb-1.5">Tasks</label>
              {formData.tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => handleTaskChange(index, e.target.value)}
                      className="input-field pl-4"
                      placeholder={`Task ${index + 1}`}
                    />
                  </div>
                  {formData.tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="text-text-muted hover:text-status-error p-2 rounded-lg transition"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTask}
                className="text-primary hover:text-primary-hover text-sm font-medium transition flex items-center gap-1"
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              <CheckCircle size={18} />
              Start Session
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
