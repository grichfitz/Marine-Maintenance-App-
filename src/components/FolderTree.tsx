import React from "react";

/* ---------- Types ---------- */

type Folder = {
  id: string;
  name: string;
};

type FolderTreeProps = {
  folders: Folder[];
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
};

/* ---------- Component ---------- */

export default function FolderTree({
  folders,
  selectedCategoryIds,
  onChange,
}: FolderTreeProps) {
  function toggleCategory(id: string) {
    if (selectedCategoryIds.includes(id)) {
      onChange(selectedCategoryIds.filter((c) => c !== id));
    } else {
      onChange([...selectedCategoryIds, id]);
    }
  }

  if (!folders.length) {
    return <p style={{ color: "#666" }}>No categories</p>;
  }

  return (
    <div style={{ paddingLeft: 4 }}>
      {folders.map((folder) => (
        <label
          key={folder.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(folder.id)}
            onChange={() => toggleCategory(folder.id)}
          />
          {folder.name}
        </label>
      ))}
    </div>
  );
}
