import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import OverviewTab from '../components/mindguard/OverviewTab';
import LiveMonitorTab from '../components/mindguard/LiveMonitorTab';
import ExtensionTab from '../components/mindguard/ExtensionTab';
import ControlsTab from '../components/mindguard/ControlsTab';
import { Activity, Radio, Chrome, Shield } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'live', label: 'Live Monitor', icon: Radio },
  { id: 'controls', label: 'Controls', icon: Shield },
  { id: 'extension', label: 'Extension', icon: Chrome },
];

export default function MindGuard() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-[#2E2E32] bg-[#1A1A1A] px-8 pt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MindGuard</h1>
            <p className="text-[#8E8E93] text-sm mt-1">
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
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[12px] text-sm font-semibold transition whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'text-[#FF841C] border-[#FF841C] bg-[#232325]'
                      : 'text-[#8E8E93] hover:text-white border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'live' && <LiveMonitorTab />}
            {activeTab === 'controls' && <ControlsTab />}
            {activeTab === 'extension' && <ExtensionTab />}
          </div>
        </div>
      </main>
    </div>
  );
}