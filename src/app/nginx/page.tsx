'use client';
import { useEffect, useState } from "react";
import styles from "./nginx.module.scss";

type ProxyType = "PROXY" | "REDIRECT";

interface ProxyEntry {
  id: number;
  proxy_pass_host: string;
  domains: string;
  nginx_custom_code?: string;
  type: ProxyType;
  ssl: boolean;
}

const emptyEntry: ProxyEntry = {
  id: 0,
  proxy_pass_host: "",
  domains: "",
  nginx_custom_code: "",
  type: "PROXY",
  ssl: false,
};

export default function NginxManagement() {
  const [entries, setEntries] = useState<ProxyEntry[]>([]);
  const [editing, setEditing] = useState<ProxyEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () =>
    fetch("/api/nginx")
      .then((res) => res.json())
      .then(setEntries);

  useEffect(() => {
    refresh();
  }, []);

  const onEdit = (entry: ProxyEntry) => setEditing({ ...entry });
  const onCreate = () => setEditing({ ...emptyEntry, id: 0 });
  const onCancel = () => setEditing(null);

  const onChange = (field: keyof ProxyEntry, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const onSave = async () => {
    setLoading(true);
    await fetch("/api/nginx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setEditing(null);
    setLoading(false);
    refresh();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    setLoading(true);
    await fetch("/api/nginx", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    refresh();
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Nginx Management</h2>
      <button onClick={onCreate} className={styles.add}>Add Entry</button>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Domains</th>
              <th>Proxy Host</th>
              <th>Type</th>
              <th>SSL</th>
              <th colSpan={2}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.domains}</td>
                <td>{entry.proxy_pass_host}</td>
                <td>{entry.type}</td>
                <td>{entry.ssl ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => onEdit(entry)} className={styles.button}>Edit</button>
                </td>
                <td>
                  <button onClick={() => onDelete(entry.id)} className={styles.delete}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editing.id ? "Edit Nginx Entry" : "Create Nginx Entry"}</h3>
            <label>
              Domains
              <input value={editing.domains} onChange={e => onChange("domains", e.target.value)} />
            </label>
            <label>
              Proxy Host
              <input value={editing.proxy_pass_host} onChange={e => onChange("proxy_pass_host", e.target.value)} />
            </label>
            <label>
              Type
              <select value={editing.type} onChange={e => onChange("type", e.target.value as ProxyType)}>
                <option value="PROXY">PROXY</option>
                <option value="REDIRECT">REDIRECT</option>
              </select>
            </label>
            <label>
              SSL
              <input type="checkbox" checked={editing.ssl} onChange={e => onChange("ssl", e.target.checked)} />
            </label>
            <label>
              Custom Nginx Code
              <textarea value={editing.nginx_custom_code ?? ''} onChange={e => onChange("nginx_custom_code", e.target.value)} />
            </label>
            <div className={styles.modalActions}>
              <button onClick={onSave} disabled={loading} className={styles.button}>Save</button>
              <button onClick={onCancel} disabled={loading} className={styles.cancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}