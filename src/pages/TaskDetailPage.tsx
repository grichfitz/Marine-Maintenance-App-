import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import FolderTree from "../components/FolderTree";

/* ---------- Types ---------- */

type MeasurementOption = {
  id: string;
  unit: string;
};

type PeriodOption = {
  id: string;
  name: string;
};

type FolderOption = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  description: string;
  measurement_id: string | null;
  period_id: string | null;
};

/* ---------- Styles ---------- */

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 16,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 0",
  fontSize: 14,
  border: "none",
  background: "transparent",
  color: "black",
  outline: "none",
  appearance: "none",
};

/* ---------- Component ---------- */

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    loadData();
  }, [taskId]);

  /* ---------- Data loading ---------- */

  async function loadData() {
    const [
      { data: taskData, error: taskError },
      { data: measurementData },
      { data: periodData },
      { data: folderData },
      { data: categoryLinks },
    ] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", taskId).single(),

      supabase
        .from("measurements")
        .select("id, unit")
        .order("unit"),

      supabase
        .from("periods")
        .select("id, name")
        .order("name"),

      supabase
        .from("task_category_nodes")
        .select("id, name")
        .order("name"),

      supabase
        .from("task_category_links")
        .select("category_id")
        .eq("task_id", taskId),
    ]);

    if (taskError) {
      console.error(taskError);
      return;
    }

    setTask(taskData);
    setMeasurements(dedupeMeasurements(measurementData ?? []));
    setPeriods(periodData ?? []);
    setFolders(folderData ?? []);
    setSelectedCategoryIds(categoryLinks?.map((l) => l.category_id) ?? []);
  }

  function dedupeMeasurements(items: MeasurementOption[]) {
    const seen = new Set<string>();
    return items.filter((m) => {
      if (seen.has(m.unit)) return false;
      seen.add(m.unit);
      return true;
    });
  }

  /* ---------- Task field update ---------- */

  async function updateTask(update: Partial<Task>) {
    if (!task) return;

    setTask((t) => (t ? { ...t, ...update } : t));
    setSaving(true);

    const { error } = await supabase
      .from("tasks")
      .update(update)
      .eq("id", task.id);

    if (error) {
      console.error("Failed to save task", error);
    }

    setSaving(false);
  }

  /* ---------- Category update (SINGLE SOURCE OF TRUTH) ---------- */

  async function updateCategories(newCategoryIds: string[]) {
    if (!task) return;

    setSelectedCategoryIds(newCategoryIds);
    setSaving(true);

    const { data: existing } = await supabase
      .from("task_category_links")
      .select("category_id")
      .eq("task_id", task.id);

    const existingIds = existing?.map((e) => e.category_id) ?? [];

    const toAdd = newCategoryIds.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !newCategoryIds.includes(id));

    if (toAdd.length > 0) {
      await supabase.from("task_category_links").insert(
        toAdd.map((category_id) => ({
          task_id: task.id,
          category_id,
        }))
      );
    }

    if (toRemove.length > 0) {
      await supabase
        .from("task_category_links")
        .delete()
        .eq("task_id", task.id)
        .in("category_id", toRemove);
    }

    setSaving(false);
  }

  if (!task) return <div>Loading…</div>;

  /* ---------- Render ---------- */

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginBottom: 16,
          fontSize: 14,
          cursor: "pointer",
          color: "black",
        }}
      >
        ← Back
      </button>

      <p style={{ marginBottom: 8 }}>
        <strong>Description</strong>
        <br />
        {task.description}
      </p>

      <hr style={{ marginBottom: 20 }} />

      {/* Measurement */}
      <label style={labelStyle}>
        <strong>Unit of Measurement</strong>
        <select
          style={selectStyle}
          value={task.measurement_id ?? ""}
          onChange={(e) =>
            updateTask({ measurement_id: e.target.value || null })
          }
        >
          <option value="">—</option>
          {measurements.map((m) => (
            <option key={m.id} value={m.id}>
              {m.unit}
            </option>
          ))}
        </select>
      </label>

      {/* Period */}
      <label style={labelStyle}>
        <strong>Period</strong>
        <select
          style={selectStyle}
          value={task.period_id ?? ""}
          onChange={(e) =>
            updateTask({ period_id: e.target.value || null })
          }
        >
          <option value="">—</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {/* Categories */}
      <hr style={{ margin: "24px 0" }} />

      <p style={{ marginBottom: 8 }}>
        <strong>Categories</strong>
      </p>

      <FolderTree
        folders={folders}
        selectedCategoryIds={selectedCategoryIds}
        onChange={updateCategories}
      />

      {saving && <p style={{ color: "#666" }}>Saving…</p>}
    </div>
  );
}
