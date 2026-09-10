import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DocumentsTab from '../components/assistant/DocumentsTab';
import AITutorTab from '../components/assistant/AITutorTab';
import QuickRevisionTab from '../components/assistant/QuickRevisionTab';
import PracticeTab from '../components/assistant/PracticeTab';
import { FileText, MessageCircle, Brain, Sparkles, Calendar } from 'lucide-react';

const TABS = [
  { id: 'documents', label: 'Documents',       icon: FileText },
  { id: 'tutor',     label: 'AI Tutor',        icon: MessageCircle },
  { id: 'practice',  label: 'Practice',        icon: Brain },
  { id: 'revision',  label: 'Quick Revision',  icon: Sparkles },
  { id: 'planner',   label: 'Planner',         icon: Calendar,     disabled: true },
];

export default function Assistant() {
  const [activeTab, setActiveTab] = useState('tutor');
  const [selectedDocId, setSelectedDocId] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#E8ECE7]/50 bg-white/70 backdrop-blur-sm px-8 pt-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-[#1F2937] tracking-tight">
              KIKO AI
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
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
                  disabled={tab.disabled}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[12px] text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'text-[#1B4332] border-[#1B4332]'
                      : tab.disabled
                      ? 'text-[#9CA3AF] cursor-not-allowed border-transparent'
                      : 'text-[#4B5563] hover:text-[#1B4332] border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.disabled && (
                    <span className="text-[9px] font-medium bg-[#E8ECE7] text-[#6B7280] px-1.5 py-0.5 rounded-full">
                      soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content — full width */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
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
          </div>
        </div>
      </main>
    </div>
  );
}