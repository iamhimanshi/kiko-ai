import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import OverviewTab from '../components/analytics/OverviewTab';
import SessionsTab from '../components/analytics/SessionsTab';
import FocusTrendsTab from '../components/analytics/FocusTrendsTab';
import { BarChart3, BookOpen, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'trends', label: 'Focus Trends', icon: TrendingUp },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-[#FFF8F5]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-sm px-8 pt-8">
          <div className="mb-6">
            <h1 className="text-4xl font-extrabold text-[#172033] tracking-tight">Analytics</h1>
            <p className="text-[#64748B] text-sm mt-1">
              Understand your study habits and improve your focus.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[12px] text-sm font-semibold transition whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'text-[#FF5C5C] border-[#FF5C5C] bg-[#FFF0EB]/60'
                      : 'text-[#64748B] hover:text-[#172554] hover:bg-[#FFF8F5] border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'trends' && <FocusTrendsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}