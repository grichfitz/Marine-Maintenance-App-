// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Login from './pages/Login';
import EngineerDashboard from './pages/EngineerDashboard';
import ManagerLayout from './pages/managerDashboard';
import EngineeringYachtPage from './pages/EngineeringYachtPage';
import Footer from './components/Footer';

// Manager pages
import UsersListPage from './pages/UsersListPage';
import UserDetailPage from './pages/UserDetailPage';
import YachtsListPage from './pages/YachtsListPage';
import YachtDetailPage from './pages/YachtDetailPage';

import TaskDetailPage from "./pages/TaskDetailPage";

import './App.css';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'engineer' | 'manager' | 'owner';
  user_id: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) setProfile(null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setLoadingProfile(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setProfile(data ?? null);
      setLoadingProfile(false);
    };

    loadProfile();
  }, [session]);

  if (!session) return <Login />;
  if (loadingProfile) return <p>Loading profile…</p>;
  if (!profile) return <p>No profile found.</p>;

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <div className="app-header-inner">
            <span className="app-title">Marine Maintenance</span>
          </div>
        </header>


        <main className="app-main">
          <Routes>
            {/* Landing route */}
            <Route
              path="/"
              element={
                profile.role === 'engineer' ? (
                  <EngineerDashboard />
                ) : profile.role === 'manager' ? (
                  <ManagerLayout />
                ) : (
                  <div>
                    <h2>Owner</h2>
                  </div>
                )
              }
            />

            {/* Engineering */}
            <Route
              path="/engineering/yachts/:yachtId"
              element={<EngineeringYachtPage />}
            />

            <Route
              path="/engineering/tasks/:taskId"
              element={<TaskDetailPage />}
            />

            {/* Manager routes */}
            {profile.role === 'manager' && (
              <>
                <Route path="/manager/users" element={<UsersListPage />} />
                <Route path="/manager/users/:id" element={<UserDetailPage />} />

                <Route path="/manager/yachts" element={<YachtsListPage />} />
                <Route
                  path="/manager/yachts/:id"
                  element={<YachtDetailPage />}
                />
              </>
            )}
          </Routes>
        </main>

        <Footer onLogout={() => supabase.auth.signOut()} />
      </div>
    </BrowserRouter>
  );
}
