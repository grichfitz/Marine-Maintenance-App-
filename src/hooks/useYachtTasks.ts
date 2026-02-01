// src/hooks/useYachtTasks.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Measurement {
  id: string;
  name: string;
  unit: string;
  type: string;
}

export interface TaskCategoryNode {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  description: string;
  priority: number;
  measurement: Measurement | null;
  categories: TaskCategoryNode[];
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

      const { data, error } = await supabase
        .from('yacht_tasks')
        .select(`
          task:tasks (
            id,
            description,
            priority,
            measurement:measurement_id (
              id,
              name,
              unit,
              type
            ),
            task_category_links (
              task_category_nodes (
                id,
                name
              )
            )
          )
        `)
        .eq('yacht_id', yachtId);

      if (error) {
        console.error('Load yacht tasks error:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped =
        data
          ?.map((row: any) => row.task)
          .filter(Boolean)
          .sort((a: any, b: any) => a.priority - b.priority)
          .map((t: any) => ({
            id: t.id,
            description: t.description,
            priority: t.priority,
            measurement: t.measurement ?? null,
            categories:
              t.task_category_links?.map(
                (l: any) => l.task_category_nodes
              ) ?? [],
          })) ?? [];

      setTasks(mapped);
      setLoading(false);
    };

    loadTasks();
  }, [yachtId]);

  return { tasks, loading, error };
}
