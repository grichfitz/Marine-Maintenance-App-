// src/App.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerLayout from './pages/manager/ManagerLayout';
import EngineerDashboard from './pages/EngineerDashboard';
import Footer from './components/Footer';
import './App.css';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'owner' | 'manager' | 'engineer';
  company: string | null;
  user_id: string;
  created_at: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  /**
   * AUTH SESSION HANDLING
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
          setProfileError(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * LOAD USER PROFILE
   */
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }

        if (!data) {
          setProfile(null);
          setProfileError('No profile found for this account.');
        } else {
          setProfile(data as Profile);
        }
      } catch (err: any) {
        console.error('Unexpected profile error:', err);
        setProfile(null);
        setProfileError('Failed to load user profile.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [session]);

  /**
   * LOGOUT
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileError(null);
  };

  /**
   * ROUTING
   */
  if (!session) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Marine Maintenance</h1>
      </header>

      <main className="app-main">
        {loadingProfile && <p>Loading profile...</p>}

        {!loadingProfile && profileError && (
          <div className="error-box">
            <p>{profileError}</p>
            <p>Please contact an administrator.</p>
          </div>
        )}

        {!loadingProfile && profile && (
          <>
            {profile.role === 'engineer' && <EngineerDashboard />}

            {profile.role === 'manager' && <ManagerLayout />}

            {(profile.role === 'owner') && (
              <div className="profile-card">
                <h2>Welcome, {profile.full_name ?? 'User'}</h2>
                <p>
                  <strong>Role:</strong> {profile.role}
                </p>
                {profile.company && (
                  <p>
                    <strong>Company:</strong> {profile.company}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer onLogout={handleLogout} />
    </div>
  );
}
