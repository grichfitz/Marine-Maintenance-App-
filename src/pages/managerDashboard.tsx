<<<<<<< HEAD
import React, { useState } from "react";
import UsersPage from "./UsersListPage";
import YachtsListPage from "./YachtsListPage";
import YachtDetailPage from "./YachtDetailPage";
import EngineerDashboard from "./EngineerDashboard";

type ManagerPage = "users" | "yachts" | "engineering";

export default function ManagerLayout() {
  const [page, setPage] = useState<ManagerPage>("users");
  const [selectedYachtId, setSelectedYachtId] = useState<string | null>(null);

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    cursor: "pointer",
    borderBottom: active ? "2px solid #000" : "2px solid transparent",
    fontWeight: active ? 600 : 400,
  });

  return (
    <div style={{ padding: "8px 24px 16px" }}>

      {/* Smaller, tighter header */}
      <h2 style={{ margin: "0 0 12px 0" }}>Management</h2>

      {/* Text nav */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 16,
          borderBottom: "1px solid #ddd",
        }}
      >
        <div
          style={navItemStyle(page === "users")}
          onClick={() => setPage("users")}
        >
          Users
        </div>

        <div
          style={navItemStyle(page === "yachts")}
          onClick={() => {
            setSelectedYachtId(null);
            setPage("yachts");
          }}
        >
          Yachts
        </div>

        <div
          style={navItemStyle(page === "engineering")}
          onClick={() => setPage("engineering")}
        >
          Engineering
        </div>
      </div>

      <div>
        {page === "users" && <UsersPage />}

        {page === "yachts" && !selectedYachtId && (
          <YachtsListPage onSelectYacht={setSelectedYachtId} />
        )}

        {page === "yachts" && selectedYachtId && (
          <YachtDetailPage
            yachtId={selectedYachtId}
            onBack={() => setSelectedYachtId(null)}
          />
        )}

        {page === "engineering" && <EngineerDashboard />}
=======
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
>>>>>>> 6597f865e94fa9e49a28625e93dc940eaa66bee4
      </div>
    </div>
  );
}
