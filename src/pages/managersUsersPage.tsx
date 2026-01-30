import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  user_id: string;
}

interface Yacht {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [assignedYachtIds, setAssignedYachtIds] = useState<string[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load ALL users (profiles)
   */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, user_id')
          .order('full_name');

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load users.');
      }
    };

    loadUsers();
  }, []);

  /**
   * Load ALL yachts
   */
  useEffect(() => {
    const loadYachts = async () => {
      try {
        const { data, error } = await supabase
          .from('yachts')
          .select('id, name')
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
   * Load yacht assignments for selected user (engineers only)
   */
  useEffect(() => {
    if (!selectedUser || selectedUser.role !== 'engineer') {
      setAssignedYachtIds([]);
      return;
    }

    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const { data, error } = await supabase
          .from('engineer_yachts')
          .select('yacht_id')
          .eq('engineer_profile_id', selectedUser.id);

        if (error) throw error;
        setAssignedYachtIds(data.map((r) => r.yacht_id));
      } catch (err) {
        console.error(err);
        setError('Failed to load yacht assignments.');
      } finally {
        setLoadingAssignments(false);
      }
    };

    loadAssignments();
  }, [selectedUser]);

  /**
   * Assign / unassign yacht to engineer
   */
  const toggleYachtAssignment = async (yachtId: string) => {
    if (!selectedUser) return;

    const isAssigned = assignedYachtIds.includes(yachtId);

    try {
      if (isAssigned) {
        await supabase
          .from('engineer_yachts')
          .delete()
          .eq('engineer_profile_id', selectedUser.id)
          .eq('yacht_id', yachtId);

        setAssignedYachtIds((prev) =>
          prev.filter((id) => id !== yachtId)
        );
      } else {
        await supabase.from('engineer_yachts').insert({
          engineer_profile_id: selectedUser.id,
          yacht_id: yachtId,
        });

        setAssignedYachtIds((prev) => [...prev, yachtId]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update yacht assignment.');
    }
  };

  return (
    <div className="users-page">
      <h2>Users</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* User list */}
        <div style={{ minWidth: 260 }}>
          <h3>User List</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => setSelectedUser(user)}
                  style={{
                    fontWeight:
                      selectedUser?.id === user.id ? 'bold' : 'normal',
                  }}
                >
                  {user.full_name ?? 'Unnamed User'} ({user.role})
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User details */}
        {selectedUser && (
          <div style={{ flex: 1 }}>
            <h3>User Details</h3>

            <p>
              <strong>Name:</strong>{' '}
              {selectedUser.full_name ?? '—'}
            </p>
            <p>
              <strong>Role:</strong> {selectedUser.role}
            </p>

            <h4>Assigned Yachts</h4>

            {selectedUser.role !== 'engineer' ? (
              <p>
                Yacht assignments are only applicable to engineers.
              </p>
            ) : loadingAssignments ? (
              <p>Loading assignments…</p>
            ) : (
              <ul>
                {yachts.map((yacht) => (
                  <li key={yacht.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={assignedYachtIds.includes(
                          yacht.id
                        )}
                        onChange={() =>
                          toggleYachtAssignment(yacht.id)
                        }
                      />
                      {yacht.name}
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
