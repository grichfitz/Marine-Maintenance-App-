// src/pages/EngineerDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useYachts } from '../hooks/useYachts';

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const { yachts, loading, error } = useYachts();

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
          </li>
        ))}
      </ul>
    </div>
  );
}
