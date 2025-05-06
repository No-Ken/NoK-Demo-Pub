import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import liff from '@line/liff';
import { Toaster } from 'react-hot-toast';
import { initializeLiff, getLiff } from './liff';
import { useAuthStore } from './stores/auth.store';
import { signInWithCustomToken } from 'firebase/auth';
import { firebaseAuth } from './firebase';
import axios from 'axios';

// Pages
import SchedulePage from './pages/SchedulePage';
import ScheduleDetailPage from './pages/ScheduleDetailPage';
import WarikanPage from './pages/WarikanPage';
import WarikanDetailPage from './pages/WarikanDetailPage';
import MemoPage from './pages/MemoPage';
import MemoDetailPage from './pages/MemoDetailPage';
import MemoListPage from './pages/MemoListPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

// Context
import { UserProvider } from './contexts/UserContext';

// Constants
const LIFF_ID = import.meta.env.VITE_LIFF_ID;

function App() {
  const { setLoading, setUser, setError } = useAuthStore();
  const [liffObject, setLiffObject] = useState<any>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  
  // Initialize LIFF app
  useEffect(() => {
    const initAndAuth = async () => {
      setLoading(true);
      try {
        await initializeLiff();
        const liff = getLiff();

        if (!liff.isLoggedIn()) {
          console.log('LIFF: Not logged in, redirecting to login...');
          liff.login();
          return;
        }

        console.log('LIFF: Logged in.');
        const lineAccessToken = liff.getAccessToken();
        console.log('LIFF Access Token:', lineAccessToken ? 'Got token' : 'Not found');

        if (!lineAccessToken) {
          throw new Error('Could not get LINE access token.');
        }

        console.log('Requesting Firebase custom token from backend...');
        const response = await axios.post('/api/v1/auth/firebase-token', { lineAccessToken });
        const firebaseToken = response.data.firebaseToken;

        if (!firebaseToken) {
          throw new Error('Could not get Firebase custom token from backend.');
        }

        console.log('Signing in to Firebase with custom token...');
        const userCredential = await signInWithCustomToken(firebaseAuth, firebaseToken);
        setUser(userCredential.user);
        console.log('Firebase sign-in successful:', userCredential.user.uid);

      } catch (error: any) {
        console.error('Authentication process failed:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    initAndAuth();
  }, []);
  
  // Handle loading state
  if (!liffObject) {
    return <LoadingScreen message="読み込み中..." />;
  }
  
  // Handle LIFF error
  if (liffError) {
    return <ErrorScreen message={liffError} />;
  }
  
  return (
    <UserProvider>
      <Router>
        <Toaster position="top-center" />
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    ホーム
                  </Link>
                  <Link to="/warikan" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    割り勘
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/schedule" replace />} />
              
              {/* Schedule routes */}
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/schedule/:id" element={<ScheduleDetailPage />} />
              
              {/* Warikan routes */}
              <Route path="/warikan" element={<WarikanPage />} />
              <Route path="/warikan/:id" element={<WarikanDetailPage />} />
              
              {/* Memo routes */}
              <Route path="/memo" element={<MemoPage />} />
              <Route path="/memo/:id" element={<MemoDetailPage />} />
              <Route path="/memos" element={<MemoListPage />} />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
