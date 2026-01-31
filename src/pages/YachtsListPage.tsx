import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Yacht = {
  id: string;
  name: string;
};

export default function YachtsListPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadYachts = async () => {
      const { data, error } = await supabase
        .from("yachts")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setYachts(data);
      }
    };

    loadYachts();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Yachts</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {yachts.map((yacht) => (
          <li
            key={yacht.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/manager/yachts/${yacht.id}`)}
          >
            <strong>{yacht.name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
