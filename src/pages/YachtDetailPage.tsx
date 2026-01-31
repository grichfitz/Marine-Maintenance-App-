import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import TaskTree from "../components/TaskTree";

/* =======================
   TYPES
======================= */

type Yacht = {
  id: string;
  name: string;
  make_model: string | null;
  location: string | null;
};

type Engineer = {
  id: string;
  full_name: string;
};

/* =======================
   PAGE
======================= */

export default function YachtDetailPage() {
  const { id: yachtId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [assignedEngineerIds, setAssignedEngineerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     LOAD YACHT
  ======================= */

  useEffect(() => {
    if (!yachtId) return;

    supabase
      .from("yachts")
      .select("id, name, make_model, location")
      .eq("id", yachtId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Failed to load yacht");
          return;
        }
        setYacht(data);
        setLoading(false);
      });
  }, [yachtId]);

  /* =======================
     LOAD ENGINEERS
  ======================= */

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "engineer")
      .order("full_name")
      .then(({ data }) => {
        setEngineers(Array.isArray(data) ? data : []);
      });
  }, []);

  /* =======================
     LOAD ENGINEER ASSIGNMENTS
  ======================= */

  useEffect(() => {
    if (!yachtId) return;

    supabase
      .from("engineer_yachts")
      .select("engineer_profile_id")
      .eq("yacht_id", yachtId)
      .then(({ data }) => {
        setAssignedEngineerIds(
          Array.isArray(data)
            ? data.map((r) => r.engineer_profile_id)
            : []
        );
      });
  }, [yachtId]);

  /* =======================
     TOGGLE ENGINEER
  ======================= */

  const toggleEngineerAssignment = async (engineerId: string) => {
    if (!yachtId) return;

    const isAssigned = assignedEngineerIds.includes(engineerId);

    if (isAssigned) {
      await supabase
        .from("engineer_yachts")
        .delete()
        .eq("engineer_profile_id", engineerId)
        .eq("yacht_id", yachtId);

      setAssignedEngineerIds((prev) =>
        prev.filter((id) => id !== engineerId)
      );
    } else {
      await supabase.from("engineer_yachts").insert({
        engineer_profile_id: engineerId,
        yacht_id: yachtId,
      });

      setAssignedEngineerIds((prev) => [...prev, engineerId]);
    }
  };

  /* =======================
     RENDER
  ======================= */

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!yacht || loading) return <p>Loading…</p>;

  return (
    <div>
      {/* Back */}
      <div style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>
        ← Back
      </div>

      <h2>{yacht.name}</h2>

      <p>
        <strong>Make / Model:</strong>{" "}
        {yacht.make_model || "Unknown"}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {yacht.location || "Unknown"}
      </p>

      <hr />

      {/* Engineers */}
      <h3>Assigned Engineers</h3>
      {engineers.map((engineer) => (
        <div key={engineer.id}>
          <label>
            <input
              type="checkbox"
              checked={assignedEngineerIds.includes(engineer.id)}
              onChange={() =>
                toggleEngineerAssignment(engineer.id)
              }
            />{" "}
            {engineer.full_name}
          </label>
        </div>
      ))}

      <hr />

      {/* Tasks */}
      <h3>Available Tasks</h3>
      <TaskTree yachtId={yachtId} />
    </div>
  );
}
