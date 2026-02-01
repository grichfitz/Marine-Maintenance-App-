// src/pages/EngineerDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useYachts } from "../hooks/useYachts";

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const { yachts, loading, error } = useYachts();

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

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
