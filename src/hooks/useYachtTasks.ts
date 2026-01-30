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
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
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
          .eq('yacht_id', yachtId);

        if (error) throw error;

        const mappedTasks: Task[] = (data || [])
          .map((row: any) => row.task)
          .filter(Boolean)
          .sort((a, b) => a.priority - b.priority); // 1 = highest

        setTasks(mappedTasks);
      } catch (err) {
        console.error('Load tasks error:', err);
        setError('Failed to load tasks.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [yachtId]);

  return {
    tasks,
    loading,
    error,
  };
}
