import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { authApi } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgeVaultPage } from './pages/KnowledgeVaultPage';
import { AIChatPage } from './pages/AIChatPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MindMapPage } from './pages/MindMapPage';
import { StudyBattlePage } from './pages/StudyBattlePage';
import { DocumentUploaderModal } from './components/DocumentUploaderModal';
import { NotionAIAssistant } from './components/NotionAIAssistant';
import { FocusFlowModal } from './components/FocusFlowModal';

export const App: React.FC = () => {
  const { token, theme, user, setAuth, activeTab } = useStore();
  const [focusFlowOpen, setFocusFlowOpen] = useState(false);

  useEffect(() => {
    if (token && !user) {
      authApi
        .getMe()
        .then((res) => setAuth(token, res.data))
        .catch(() => {
          localStorage.removeItem('sb_token');
        });
    }
  }, [token, user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!token) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col md:flex-row transition-colors">
      <Sidebar onOpenFocusFlow={() => setFocusFlowOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onOpenFocusFlow={() => setFocusFlowOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'vault' && <KnowledgeVaultPage />}
          {activeTab === 'chat' && <AIChatPage />}
          {activeTab === 'flashcards' && <FlashcardsPage />}
          {activeTab === 'quiz' && <QuizPage />}
          {activeTab === 'planner' && <StudyPlannerPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'mindmap' && <MindMapPage />}
          {activeTab === 'battle' && <StudyBattlePage />}
        </main>
      </div>

      <DocumentUploaderModal />
      <NotionAIAssistant />
      <FocusFlowModal isOpen={focusFlowOpen} onClose={() => setFocusFlowOpen(false)} />
    </div>
  );
};

export default App;
