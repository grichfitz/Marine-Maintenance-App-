// src/App.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Footer from './components/Footer';
import './App.css'; // optional styling

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Load profile info
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (!session) return <Login />;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Marine Maintenance</h1>
      </header>


      <main className="app-main">
        {loadingProfile ? (
          <p>Loading profile...</p>
        ) : (
          profile && (
            <div className="profile-card">
              <h2>Welcome, {profile.full_name}!</h2>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
            </div>
          )
        )}
      </main>

      <Footer onLogout={handleLogout} />
    </div>
  );
}
