// src/pages/EngineeringYachtPage.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useYachts } from '../hooks/useYachts';
import { useYachtTasks } from '../hooks/useYachtTasks';

interface ResultState {
  [taskId: string]: {
    value?: number;
    level?: string;
    saved?: boolean;
  };
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontSize: '1.2rem',
  lineHeight: 1,
};

export default function EngineeringYachtPage() {
  const navigate = useNavigate();
  const { yachtId } = useParams<{ yachtId: string }>();

  const { yachts } = useYachts();
  const yacht = yachts.find((y) => y.id === yachtId) || null;

  const { tasks, loading, error } = useYachtTasks(yachtId ?? null);

  const [results, setResults] = useState<ResultState>({});
  const [savingTask, setSavingTask] = useState<string | null>(null);

  /**
   * Explicit save into task_results (INSERT)
   */
  const saveTask = async (
    taskId: string,
    payload: { value?: number; level?: string }
  ) => {
    if (!yachtId) return;

    setSavingTask(taskId);

    const insertPayload: any = {
      yacht_id: yachtId,
      task_id: taskId,
    };

    if (payload.value !== undefined) {
      insertPayload.measured_value = payload.value;
    }

    if (payload.level !== undefined) {
      insertPayload.measured_level = payload.level;
    }

    const { error } = await supabase
      .from('task_results')
      .insert(insertPayload);

    if (!error) {
      setResults((prev) => ({
        ...prev,
        [taskId]: { ...prev[taskId], saved: true },
      }));
    } else {
      console.error('Save failed', error);
    }

    setSavingTask(null);
  };

  /**
   * Render measurement input (no save here)
   */
  const renderInput = (task: any) => {
    if (!task.measurement) return null;

    switch (task.measurement.type) {
      case 'numeric':
        return (
          <>
            <input
              type="number"
              value={results[task.id]?.value ?? ''}
              onChange={(e) =>
                setResults((prev) => ({
                  ...prev,
                  [task.id]: {
                    value:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                    saved: false,
                  },
                }))
              }
              style={{ width: '100px' }}
            />
            <span style={{ marginLeft: '0.5rem' }}>
              {task.measurement.unit}
            </span>
          </>
        );

      case 'enum':
        return (
          <>
            <select
              value={results[task.id]?.level ?? ''}
              onChange={(e) =>
                setResults((prev) => ({
                  ...prev,
                  [task.id]: {
                    level: e.target.value || undefined,
                    saved: false,
                  },
                }))
              }
            >
              <option value="">Select</option>
              <option value="Full">Full</option>
              <option value="Half">Half</option>
              <option value="Low">Low</option>
              <option value="Empty">Empty</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>
              {task.measurement.unit}
            </span>
          </>
        );

      default:
        return null;
    }
  };

  /**
   * Render save / status icon
   */
  const renderAction = (task: any) => {
    const saved = results[task.id]?.saved;

    // INSPECTION-ONLY TASK
    if (!task.measurement) {
      return saved ? (
        <span style={{ color: 'green' }}>✔</span>
      ) : (
        <button
          style={iconButtonStyle}
          onClick={() =>
            saveTask(task.id, { level: 'OK' })
          }
        >
          ❌
        </button>
      );
    }

    // MEASURED TASKS
    return saved ? (
      <span style={{ color: 'green' }}>✔</span>
    ) : (
      <button
        style={iconButtonStyle}
        onClick={() =>
          saveTask(task.id, {
            value: results[task.id]?.value,
            level: results[task.id]?.level,
          })
        }
        disabled={savingTask === task.id}
      >
        ❌
      </button>
    );
  };

  return (
    <div className="engineering-yacht-page">
      <button onClick={() => navigate(-1)}>← Back</button>

      {yacht && (
        <>
          <h2>{yacht.name}</h2>
          <p>
            {yacht.make_model} – {yacht.location}
          </p>
        </>
      )}

      <h3>Engineering Tasks</h3>

      {loading ? (
        <p>Loading tasks…</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Measurement</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.description}</td>
                <td>{renderInput(task)}</td>
                <td>{renderAction(task)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
