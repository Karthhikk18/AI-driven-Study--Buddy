import { create } from 'zustand';

export interface Subject {
  id: number;
  name: string;
  workspace_id: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  subjects: Subject[];
  selectedSubject: Subject | null;
  setSubjects: (subjects: Subject[]) => void;
  setSelectedSubject: (subject: Subject | null) => void;
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('sb_theme') as 'light' | 'dark') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('sb_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),

  token: localStorage.getItem('sb_token'),
  user: localStorage.getItem('sb_user') ? JSON.parse(localStorage.getItem('sb_user')!) : null,
  setAuth: (token, user) => {
    localStorage.setItem('sb_token', token);
    localStorage.setItem('sb_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    set({ token: null, user: null });
  },

  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab }),

  subjects: [],
  selectedSubject: null,
  setSubjects: (subjects) => set({ subjects }),
  setSelectedSubject: (selectedSubject) => set({ selectedSubject }),

  isUploadModalOpen: false,
  setUploadModalOpen: (isUploadModalOpen) => set({ isUploadModalOpen }),

  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
