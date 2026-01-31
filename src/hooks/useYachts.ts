import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Yacht {
  id: string;
  name: string;
  make_model: string;
  location: string;
}

export function useYachts() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadYachts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('yachts')
          .select('*')
          .order('name');

        if (error) throw error;
        setYachts(data || []);
      } catch (err) {
        console.error('Load yachts error:', err);
        setError('Failed to load yachts.');
        setYachts([]);
      } finally {
        setLoading(false);
      }
    };

    loadYachts();
  }, []);

  return {
    yachts,
    loading,
    error,
  };
}
