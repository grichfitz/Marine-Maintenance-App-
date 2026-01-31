import React, { useState } from 'react';
import UsersPage from './managersUsersPage';
import YachtsPage from './managersYachtsPage';
import EngineerDashboard from './EngineerDashboard'; // ✅ correct component

type ManagerPage = 'users' | 'yachts' | 'engineering';

export default function ManagerLayout() {
  const [page, setPage] = useState<ManagerPage>('engineering');

  return (
    <div className="manager-layout">
      <h1>Management</h1>

      {/* Simple navigation */}
      <div className="manager-nav">
        <button
          onClick={() => setPage('users')}
          className={page === 'users' ? 'active' : ''}
        >
          Users
        </button>

        <button
          onClick={() => setPage('yachts')}
          className={page === 'yachts' ? 'active' : ''}
        >
          Yachts
        </button>

        <button
          onClick={() => setPage('engineering')}
          className={page === 'engineering' ? 'active' : ''}
        >
          Engineering
        </button>
      </div>

      <div className="manager-content">
        {page === 'users' && <UsersPage />}
        {page === 'yachts' && <YachtsPage />}
        {page === 'engineering' && <EngineerDashboard />}
      </div>
    </div>
  );
}
