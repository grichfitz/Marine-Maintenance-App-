// src/hooks/useYachtTasks.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Measurement {
  id: string;
  name: string;
  unit: string;
  type: string;
}

export interface Task {
  id: string;
  description: string;
  priority: number;
  measurement: Measurement | null;
}

export function useYachtTasks(yachtId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yachtId) {
      setTasks([]);
      setError(null);
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
      setError(null);

      /* -----------------------------------
         1️⃣ Load yacht_tasks
      ----------------------------------- */
      const { data: yachtTasks, error: ytError } = await supabase
        .from('yacht_tasks')
        .select('task_id')
        .eq('yacht_id', yachtId);

      if (ytError) {
        console.error('Load yacht_tasks error:', ytError.message);
        setError(ytError.message);
        setLoading(false);
        return;
      }

      const taskIds = yachtTasks.map((yt) => yt.task_id);

      if (taskIds.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      /* -----------------------------------
         2️⃣ Load tasks + measurements
      ----------------------------------- */
      const { data: tasksData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          description,
          priority,
          measurement:measurement_id (
            id,
            name,
            unit,
            type
          )
        `)
        .in('id', taskIds);

      if (taskError) {
        console.error('Load tasks error:', taskError.message);
        setError(taskError.message);
        setLoading(false);
        return;
      }

      /* -----------------------------------
         3️⃣ Sort & set
      ----------------------------------- */
      const sorted = tasksData
        .sort((a, b) => a.priority - b.priority)
        .map((t) => ({
          id: t.id,
          description: t.description,
          priority: t.priority,
          measurement: t.measurement ?? null,
        }));

      setTasks(sorted);
      setLoading(false);
    };

    loadTasks();
  }, [yachtId]);

  return { tasks, loading, error };
}
