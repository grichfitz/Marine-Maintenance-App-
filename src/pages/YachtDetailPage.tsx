import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

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

type Task = {
  id: string;
  description: string;
};

export default function YachtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [assignedEngineerIds, setAssignedEngineerIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<string[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load yacht details
   */
  useEffect(() => {
    if (!id) return;

    const loadYacht = async () => {
      const { data, error } = await supabase
        .from("yachts")
        .select("id, name, make_model, location")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to load yacht.");
        return;
      }

      setYacht(data);
    };

    loadYacht();
  }, [id]);

  /**
   * Load all engineers
   */
  useEffect(() => {
    const loadEngineers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "engineer")
        .order("full_name");

      setEngineers(Array.isArray(data) ? data : []);
    };

    loadEngineers();
  }, []);

  /**
   * Load assigned engineers
   */
  useEffect(() => {
    if (!id) return;

    const loadEngineerAssignments = async () => {
      const { data } = await supabase
        .from("engineer_yachts")
        .select("engineer_profile_id")
        .eq("yacht_id", id);

      setAssignedEngineerIds(
        Array.isArray(data)
          ? data.map((r) => r.engineer_profile_id)
          : []
      );

      setLoadingAssignments(false);
    };

    loadEngineerAssignments();
  }, [id]);

  /**
   * Load ALL tasks
   */
  useEffect(() => {
    const loadTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, description")
        .order("description");

      if (error) {
        console.error("Failed to load tasks", error);
        setTasks([]);
        return;
      }

      setTasks(Array.isArray(data) ? data : []);
    };

    loadTasks();
  }, []);

  /**
   * Load assigned tasks for this yacht
   */
  useEffect(() => {
    if (!id) return;

    const loadTaskAssignments = async () => {
      const { data } = await supabase
        .from("yacht_tasks")
        .select("task_id")
        .eq("yacht_id", id);

      setAssignedTaskIds(
        Array.isArray(data) ? data.map((r) => r.task_id) : []
      );
    };

    loadTaskAssignments();
  }, [id]);

  /**
   * Toggle engineer assignment
   */
  const toggleEngineerAssignment = async (engineerId: string) => {
    if (!id) return;

    const isAssigned = assignedEngineerIds.includes(engineerId);

    if (isAssigned) {
      await supabase
        .from("engineer_yachts")
        .delete()
        .eq("engineer_profile_id", engineerId)
        .eq("yacht_id", id);

      setAssignedEngineerIds((prev) =>
        prev.filter((e) => e !== engineerId)
      );
    } else {
      await supabase.from("engineer_yachts").insert({
        engineer_profile_id: engineerId,
        yacht_id: id,
      });

      setAssignedEngineerIds((prev) => [...prev, engineerId]);
    }
  };

  /**
   * Toggle task assignment
   */
  const toggleTaskAssignment = async (taskId: string) => {
    if (!id) return;

    const isAssigned = assignedTaskIds.includes(taskId);

    if (isAssigned) {
      await supabase
        .from("yacht_tasks")
        .delete()
        .eq("yacht_id", id)
        .eq("task_id", taskId);

      setAssignedTaskIds((prev) =>
        prev.filter((t) => t !== taskId)
      );
    } else {
      await supabase.from("yacht_tasks").insert({
        yacht_id: id,
        task_id: taskId,
      });

      setAssignedTaskIds((prev) => [...prev, taskId]);
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

  if (!yacht) {
    return <div>Loading yacht…</div>;
  }

  return (
    <div>
      {/* Back */}
      <div
        style={{ cursor: "pointer", marginBottom: 12 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </div>

      <h2 style={{ marginTop: 0 }}>{yacht.name}</h2>

      <p>
        <strong>Make / Model:</strong>{" "}
        {yacht.make_model || "Unknown"}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {yacht.location || "Unknown"}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h3>Assigned Engineers</h3>

      {loadingAssignments ? (
        <p>Loading assignments…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {engineers.map((engineer) => (
            <li key={engineer.id} style={{ padding: "6px 0" }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={assignedEngineerIds.includes(
                    engineer.id
                  )}
                  onChange={() =>
                    toggleEngineerAssignment(engineer.id)
                  }
                />{" "}
                {engineer.full_name}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* TASKS SECTION */}
      <hr style={{ margin: "24px 0" }} />

      <h3>Available Tasks</h3>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {tasks.map((task) => (
          <li key={task.id} style={{ padding: "6px 0" }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={assignedTaskIds.includes(task.id)}
                onChange={() => toggleTaskAssignment(task.id)}
              />{" "}
              {task.description}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
