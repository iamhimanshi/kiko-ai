import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DocumentsTab from '../components/assistant/DocumentsTab';
import AITutorTab from '../components/assistant/AITutorTab';
import QuickRevisionTab from '../components/assistant/QuickRevisionTab';
import PracticeTab from '../components/assistant/PracticeTab';
import PlannerTab from '../components/assistant/PlannerTab';
import { FileText, MessageCircle, Brain, Sparkles, Calendar } from 'lucide-react';

const TABS = [
  { id: 'documents', label: 'Documents',      icon: FileText },
  { id: 'tutor',     label: 'AI Tutor',       icon: MessageCircle },
  { id: 'practice',  label: 'Practice',       icon: Brain },
  { id: 'revision',  label: 'Quick Revision', icon: Sparkles },
  { id: 'planner',   label: 'Planner',        icon: Calendar },
];

export default function Assistant() {
  const [activeTab, setActiveTab] = useState('tutor');
  const [selectedDocId, setSelectedDocId] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-[#2E2E32] bg-[#1A1A1A] px-8 pt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              DayDive <span className="text-[#FF841C]">AI</span>
            </h1>
            <p className="text-[#8E8E93] text-sm mt-1">
              Your personal learning workspace
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
            {activeTab === 'documents' && (
              <DocumentsTab onDocumentReady={(id) => setSelectedDocId(id)} />
            )}
            {activeTab === 'tutor' && (
              <AITutorTab
                selectedDocId={selectedDocId}
                onDocChange={setSelectedDocId}
              />
            )}
            {activeTab === 'practice' && <PracticeTab />}
            {activeTab === 'revision' && (
              <QuickRevisionTab initialDocId={selectedDocId} />
            )}
            {activeTab === 'planner' && <PlannerTab />}
          </div>
        </div>
      </main>
    </div>
  );
}