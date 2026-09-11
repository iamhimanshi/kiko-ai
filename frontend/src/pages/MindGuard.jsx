import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import OverviewTab from '../components/mindguard/OverviewTab';
import LiveMonitorTab from '../components/mindguard/LiveMonitorTab';
import ExtensionTab from '../components/mindguard/ExtensionTab';
import { Activity, Radio, Chrome } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview',     icon: Activity },
  { id: 'live',     label: 'Live Monitor', icon: Radio },
  { id: 'extension',label: 'Extension',    icon: Chrome },
];

export default function MindGuard() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#E8ECE7]/50 bg-white/70 backdrop-blur-sm px-8 pt-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-[#1F2937] tracking-tight">
              MindGuard
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Your focus companion — understand and stay on track.
            </p>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[12px] text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'text-[#1B4332] border-[#1B4332]'
                      : 'text-[#4B5563] hover:text-[#1B4332] border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content — full width */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === 'overview'  && <OverviewTab />}
            {activeTab === 'live'      && <LiveMonitorTab />}
            {activeTab === 'extension' && <ExtensionTab />}
          </div>
        </div>
      </main>
    </div>
  );
}