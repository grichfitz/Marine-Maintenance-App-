import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Yacht {
  id: string;
  name: string;
  make_model: string;
  location: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);
  const [assignedEngineerIds, setAssignedEngineerIds] = useState<string[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load ALL yachts
   */
  useEffect(() => {
    const loadYachts = async () => {
      try {
        const { data, error } = await supabase
          .from('yachts')
          .select('id, name, make_model, location')
          .order('name');

        if (error) throw error;
        setYachts(data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load yachts.');
      }
    };

    loadYachts();
  }, []);

  /**
   * Load ALL engineers
   */
  useEffect(() => {
    const loadEngineers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'engineer')
          .order('full_name');

        if (error) throw error;
        setEngineers(data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load engineers.');
      }
    };

    loadEngineers();
  }, []);

  /**
   * Load engineer assignments for selected yacht
   */
  useEffect(() => {
    if (!selectedYacht) {
      setAssignedEngineerIds([]);
      return;
    }

    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const { data, error } = await supabase
          .from('engineer_yachts')
          .select('engineer_profile_id')
          .eq('yacht_id', selectedYacht.id);

        if (error) throw error;
        setAssignedEngineerIds(
          data.map((r) => r.engineer_profile_id)
        );
      } catch (err) {
        console.error(err);
        setError('Failed to load engineer assignments.');
      } finally {
        setLoadingAssignments(false);
      }
    };

    loadAssignments();
  }, [selectedYacht]);

  /**
   * Assign / unassign engineer to yacht
   */
  const toggleEngineerAssignment = async (engineerId: string) => {
    if (!selectedYacht) return;

    const isAssigned = assignedEngineerIds.includes(engineerId);

    try {
      if (isAssigned) {
        await supabase
          .from('engineer_yachts')
          .delete()
          .eq('engineer_profile_id', engineerId)
          .eq('yacht_id', selectedYacht.id);

        setAssignedEngineerIds((prev) =>
          prev.filter((id) => id !== engineerId)
        );
      } else {
        await supabase.from('engineer_yachts').insert({
          engineer_profile_id: engineerId,
          yacht_id: selectedYacht.id,
        });

        setAssignedEngineerIds((prev) => [...prev, engineerId]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update engineer assignment.');
    }
  };

  return (
    <div className="yachts-page">
      <h2>Yachts</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Yacht list */}
        <div style={{ minWidth: 260 }}>
          <h3>Yacht List</h3>
          <ul>
            {yachts.map((yacht) => (
              <li key={yacht.id}>
                <button
                  onClick={() => setSelectedYacht(yacht)}
                  style={{
                    fontWeight:
                      selectedYacht?.id === yacht.id ? 'bold' : 'normal',
                  }}
                >
                  {yacht.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Yacht details */}
        {selectedYacht && (
          <div style={{ flex: 1 }}>
            <h3>Yacht Details</h3>

            <p>
              <strong>Name:</strong> {selectedYacht.name}
            </p>
            <p>
              <strong>Make / Model:</strong>{' '}
              {selectedYacht.make_model}
            </p>
            <p>
              <strong>Location:</strong> {selectedYacht.location}
            </p>

            <h4>Assigned Engineers</h4>

            {loadingAssignments ? (
              <p>Loading assignments…</p>
            ) : (
              <ul>
                {engineers.map((engineer) => (
                  <li key={engineer.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={assignedEngineerIds.includes(
                          engineer.id
                        )}
                        onChange={() =>
                          toggleEngineerAssignment(engineer.id)
                        }
                      />
                      {engineer.full_name ?? 'Unnamed Engineer'}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
