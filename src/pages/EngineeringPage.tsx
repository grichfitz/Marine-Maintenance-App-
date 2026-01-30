import React, { useState } from 'react';
import { useYachts } from '../hooks/useYachts';
import { useYachtTasks } from '../hooks/useYachtTasks';

interface Yacht {
  id: string;
  name: string;
  make_model: string;
  location: string;
}

export default function EngineeringPage() {
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);

  const {
    yachts,
    loading: loadingYachts,
    error: yachtsError,
  } = useYachts();

  const {
    tasks,
    loading: loadingTasks,
    error: tasksError,
  } = useYachtTasks(selectedYacht?.id ?? null);

  return (
    <div>
      <h2>Engineering</h2>

      {(yachtsError || tasksError) && (
        <p style={{ color: 'red' }}>{yachtsError || tasksError}</p>
      )}

      {loadingYachts ? (
        <p>Loading yachts...</p>
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
        <>
          <h3>Tasks for {selectedYacht.name}</h3>

          {loadingTasks ? (
            <p>Loading tasks...</p>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Measurement</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.description}</td>
                    <td>{task.measurement?.name ?? '-'}</td>
                    <td>{task.measurement?.unit ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
