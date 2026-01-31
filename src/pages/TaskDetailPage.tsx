import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Task = {
  id: string;
  description: string;
  folder_id: string | null;
  position: number;
};

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>(); // ✅ FIX
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, description, folder_id, position")
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("Failed to load task:", error);
        return;
      }

      setTask(data);
    };

    loadTask();
  }, [taskId]);

  if (!task) {
    return <p>Loading task…</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* ✅ BACK BUTTON — NOW VISIBLE */}
      <div
        style={{ cursor: "pointer", marginBottom: 12 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </div>

      <h2 style={{ marginTop: 0 }}>Task Details</h2>

      <p>
        <strong>ID:</strong> {task.id}
      </p>

      <p>
        <strong>Description:</strong> {task.description}
      </p>

      <p>
        <strong>Folder ID:</strong>{" "}
        {task.folder_id ?? "Unassigned"}
      </p>

      <p>
        <strong>Position:</strong> {task.position}
      </p>
    </div>
  );
}
