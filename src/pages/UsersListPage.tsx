import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabase';

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
};

export default function UsersListPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name");

      if (!error && data) {
        setUsers(data);
      }
    };

    loadUsers();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Users</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {users.map((user) => (
          <li
            key={user.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/manager/users/${user.id}`)}
          >
            <strong>{user.full_name}</strong> — {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
