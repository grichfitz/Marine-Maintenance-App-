// src/pages/ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Yacht {
  id: string;
  name: string;
  make_model: string;
  location: string;
}

interface Measurement {
  id: string;
  name: string;
  unit: string;
  type: string;
}

interface Task {
  id: string;
  description: string;
  priority: number;
  measurement: Measurement | null;
}

export default function ManagerDashboard() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingYachts, setLoadingYachts] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load ALL yachts (RLS allows this for managers)
   */
  useEffect(() => {
    const loadYachts = async () => {
      setLoadingYachts(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('yachts')
          .select('*');

        if (error) throw error;
        setYachts(data || []);
      } catch (err) {
        console.error('Load yachts error:', err);
        setError('Failed to load yachts.');
      } finally {
        setLoadingYachts(false);
      }
    };

    loadYachts();
  }, []);

  /**
   * Load tasks + measurements when a yacht is selected
   */
  useEffect(() => {
    if (!selectedYacht) return;

    const loadTasks = async () => {
      setLoadingTasks(true);
      setError(null);

      try {
        const { data, error } = await supabase
        .from('yacht_tasks')
        .select(`
            task:task_id (
            id,
            description,
            priority,
            measurement:measurement_id (
                id,
                name,
                unit,
                type
            )
            )
        `)
        .eq('yacht_id', selectedYacht.id);

        if (error) throw error;

        const mappedTasks: Task[] = (data || [])
        .map((row: any) => row.task)
        .filter(Boolean)
        .sort((a, b) => a.priority - b.priority); // 🔑 1 = highest

        setTasks(mappedTasks);
      } catch (err) {
        console.error('Load tasks error:', err);
        setError('Failed to load tasks.');
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [selectedYacht]);

  return (
    <div className="manager-dashboard">
      <h2>All Yachts - Management</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loadingYachts ? (
        <p>Loading yachts...</p>
      ) : yachts.length === 0 ? (
        <p>No yachts found.</p>
      ) : (
        <ul className="yacht-list">
          {yachts.map((yacht) => (
            <li key={yacht.id}>
              <button
                onClick={() => setSelectedYacht(yacht)}
                className={selectedYacht?.id === yacht.id ? 'active' : ''}
              >
                {yacht.name} ({yacht.make_model}) – {yacht.location}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedYacht && (
        <div className="yacht-tasks">
          <h3>Tasks for {selectedYacht.name}</h3>

          {loadingTasks ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p>No tasks assigned to this yacht.</p>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Measurement</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.description}</td>
                    <td>{task.measurement?.unit ?? '-'}</td>
                    <td>{task.measurement?.name ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
