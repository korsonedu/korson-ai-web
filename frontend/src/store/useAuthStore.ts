import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  role: 'student' | 'admin';
  elo_score: number;
  avatar_url: string;
  allow_broadcast: boolean;
  show_others_broadcast: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  updateUser: (updatedUser) => set((state) => ({
    user: state.user ? { ...state.user, ...updatedUser } : null
  })),
}));
