import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  setLoading: (loading: boolean) => void;
  setUser: (user: FirebaseUser | null) => void;
  setError: (error: Error | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  isLoading: true,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setUser: (user) => set({ firebaseUser: user, isLoading: false, error: null }),
  setError: (error) => set({ error: error, isLoading: false }),
})); 