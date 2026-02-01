import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  email: string;
  created_at: string;
};

type Yacht = {
  id: string;
  name: string;
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [assignedYachtIds, setAssignedYachtIds] = useState<string[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user profile
   */
  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, email, created_at")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to load user.");
        return;
      }

      setUser(data);
    };

    loadUser();
  }, [id]);

  /**
   * Load all yachts
   */
  useEffect(() => {
    const loadYachts = async () => {
      const { data, error } = await supabase
        .from("yachts")
        .select("id, name")
        .order("name");

      if (error) {
        setError("Failed to load yachts.");
        setYachts([]);
        return;
      }

      setYachts(Array.isArray(data) ? data : []);
    };

    loadYachts();
  }, []);

  /**
   * Load assigned yachts (engineers only)
   */
  useEffect(() => {
    if (!user || user.role !== "engineer") {
      setAssignedYachtIds([]);
      return;
    }

    const loadAssignments = async () => {
      setLoadingAssignments(true);

      const { data } = await supabase
        .from("engineer_yachts")
        .select("yacht_id")
        .eq("engineer_profile_id", user.id);

      if (Array.isArray(data)) {
        setAssignedYachtIds(data.map((r) => r.yacht_id));
      } else {
        setAssignedYachtIds([]);
      }

      setLoadingAssignments(false);
    };

    loadAssignments();
  }, [user]);

  /**
   * Assign / unassign yacht
   */
  const toggleYachtAssignment = async (yachtId: string) => {
    if (!user) return;

    const isAssigned = assignedYachtIds.includes(yachtId);

    try {
      if (isAssigned) {
        await supabase
          .from("engineer_yachts")
          .delete()
          .eq("engineer_profile_id", user.id)
          .eq("yacht_id", yachtId);

        setAssignedYachtIds((prev) =>
          prev.filter((id) => id !== yachtId)
        );
      } else {
        await supabase.from("engineer_yachts").insert({
          engineer_profile_id: user.id,
          yacht_id: yachtId,
        });

        setAssignedYachtIds((prev) => [...prev, yachtId]);
      }
    } catch {
      setError("Failed to update yacht assignment.");
    }
  };

  if (error) {
    return (
      <div>
        <div
          style={{ cursor: "pointer", marginBottom: 12 }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </div>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!user) {
    return <div>Loading user…</div>;
  }

  return (
    <div>
      {/* Text-based back link */}
      <div
        style={{ cursor: "pointer", marginBottom: 12 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </div>

      <h2 style={{ marginTop: 0 }}>{user.full_name}</h2>

      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        <a href={`mailto:${user.email}`}>{user.email}</a>
      </p>
      <p>
        <strong>User ID:</strong> {user.id}
      </p>
      <p>
        <strong>Created:</strong>{" "}
        {new Date(user.created_at).toLocaleString()}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h3>Assigned Yachts</h3>

      {user.role !== "engineer" ? (
        <p>Yacht assignments are only applicable to engineers.</p>
      ) : loadingAssignments ? (
        <p>Loading assignments…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {yachts.map((yacht) => (
            <li key={yacht.id} style={{ padding: "6px 0" }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={assignedYachtIds.includes(yacht.id)}
                  onChange={() => toggleYachtAssignment(yacht.id)}
                />{" "}
                {yacht.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
