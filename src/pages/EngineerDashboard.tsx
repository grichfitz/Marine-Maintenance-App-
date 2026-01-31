// src/pages/EngineerDashboard.tsx
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { useYachts } from "../hooks/useYachts";
=======
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useYachts } from '../hooks/useYachts';
>>>>>>> 6597f865e94fa9e49a28625e93dc940eaa66bee4

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const { yachts, loading, error } = useYachts();

<<<<<<< HEAD
  if (loading) {
    return <div style={{ padding: 24 }}>Loading yachts…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Engineering</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {yachts.map((yacht) => (
          <li
            key={yacht.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
            }}
            onClick={() =>
              navigate(`/engineering/yachts/${yacht.id}`)
            }
          >
            <strong>{yacht.name}</strong>
=======
  if (loading) return <p>Loading yachts…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>My Yachts</h2>
      <ul>
        {yachts.map((yacht) => (
          <li key={yacht.id}>
            <button
              onClick={() =>
                navigate(`/engineering/yachts/${yacht.id}`)
              }
            >
              {yacht.name}
            </button>
>>>>>>> 6597f865e94fa9e49a28625e93dc940eaa66bee4
          </li>
        ))}
      </ul>
    </div>
  );
}
