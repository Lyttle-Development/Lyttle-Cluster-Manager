'use client';
import { useEffect, useState, useRef } from "react";
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

const sortOptions = [
  { key: "id", label: "ID" },
  { key: "domains", label: "Domains" },
  { key: "proxy_pass_host", label: "Proxy Host" },
  { key: "type", label: "Type" },
  { key: "ssl", label: "SSL" }
] as const;
type SortKey = typeof sortOptions[number]["key"];
type SortDir = "asc" | "desc";

function compare(a: any, b: any, dir: SortDir) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") {
    return dir === "asc" ? a.localeCompare(b) : b.localeCompare(a);
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return dir === "asc" ? Number(a) - Number(b) : Number(b) - Number(a);
  }
  return dir === "asc" ? (a as number) - (b as number) : (b as number) - (a as number);
}

function useAutoGrowTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value, ref]);
}

export default function NginxManagement() {
  const [entries, setEntries] = useState<ProxyEntry[]>([]);
  const [editing, setEditing] = useState<ProxyEntry | null>(null);
  const [loading, setLoading] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Searching
  const [searchCol, setSearchCol] = useState<SortKey>("domains");
  const [search, setSearch] = useState("");

  // Modal textarea refs for autogrow
  const domainsRef = useRef<HTMLTextAreaElement>(null);
  const hostRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useAutoGrowTextarea(domainsRef, editing?.domains ?? "");
  useAutoGrowTextarea(hostRef, editing?.proxy_pass_host ?? "");
  useAutoGrowTextarea(codeRef, editing?.nginx_custom_code ?? "");

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

  // Accessible light switch for SSL
  function SslSwitch({
    checked,
    onChange,
    id
  }: { checked: boolean, onChange: (val: boolean) => void, id: string }) {
    return (
      <label className={styles.switch} htmlFor={id}>
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          tabIndex={0}
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
        <span className={styles.label}>{checked ? "Enabled" : "Disabled"}</span>
      </label>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  let filteredEntries = entries;
  if (search.trim() !== "") {
    filteredEntries = entries.filter(entry => {
      const val = entry[searchCol];
      if (typeof val === "string") {
        return val.toLowerCase().includes(search.toLowerCase());
      }
      if (typeof val === "boolean") {
        return (search.toLowerCase() === "enabled" && val) ||
               (search.toLowerCase() === "disabled" && !val);
      }
      if (typeof val === "number") {
        return String(val).includes(search);
      }
      return false;
    });
  }

  const sortedEntries = [...filteredEntries].sort((a, b) => compare(a[sortKey], b[sortKey], sortDir));

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return <span aria-hidden="true" style={{marginLeft: 4, opacity: 0.4}}>↕</span>;
    return sortDir === "asc"
      ? <span aria-label="ascending" style={{marginLeft: 4}}>↑</span>
      : <span aria-label="descending" style={{marginLeft: 4}}>↓</span>;
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Nginx Management</h2>
      <div style={{display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", padding: "0 1.25rem"}}>
        <button onClick={onCreate} className={`${styles.button} ${styles.primary}`}>Add Entry</button>
        <label style={{fontWeight: 500, color: "var(--color-text, #fff)", fontSize: "1rem"}}>
          Search:
          <input
            style={{
              marginLeft: 8,
              marginRight: 8,
              padding: "0.45rem 0.6rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "#23233a",
              color: "#fff",
              fontSize: "1rem"
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </label>
        <label style={{fontWeight: 500, color: "var(--color-text, #fff)", fontSize: "1rem"}}>
          in
          <select
            style={{
              marginLeft: 8,
              padding: "0.45rem 0.6rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "#23233a",
              color: "#fff",
              fontSize: "1rem"
            }}
            value={searchCol}
            onChange={e => setSearchCol(e.target.value as SortKey)}
          >
            {sortOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.tableOuterPad}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {sortOptions.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    tabIndex={0}
                    aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    scope="col"
                  >
                    {col.label}{arrow(col.key)}
                  </th>
                ))}
                <th colSpan={2}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  <td style={{whiteSpace:"pre-line"}}>{entry.domains}</td>
                  <td style={{whiteSpace:"pre-line"}}>{entry.proxy_pass_host}</td>
                  <td>{entry.type}</td>
                  <td>
                    <SslSwitch checked={entry.ssl} id={`ssl-switch-${entry.id}`} onChange={() => {}} />
                  </td>
                  <td>
                    <button
                      onClick={() => onEdit(entry)}
                      className={`${styles.button} ${styles.neutral}`}
                      aria-label={`Edit entry ${entry.id}`}>
                      Edit
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className={`${styles.button} ${styles.danger}`}
                      aria-label={`Delete entry ${entry.id}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {sortedEntries.length === 0 && (
                <tr>
                  <td colSpan={sortOptions.length + 2} style={{textAlign:"center", color: "#AAA"}}>No entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{editing.id ? "Edit Nginx Entry" : "Create Nginx Entry"}</h3>
            <label>
              Domains
              <textarea
                ref={domainsRef}
                value={editing.domains}
                onChange={e => onChange("domains", e.target.value)}
                rows={2}
                spellCheck
                autoFocus
                aria-required="true"
                onInput={e => {
                  const ta = e.currentTarget;
                  ta.style.height = "auto";
                  ta.style.height = ta.scrollHeight + "px";
                }}
              />
            </label>
            <label>
              Proxy Host
              <textarea
                ref={hostRef}
                value={editing.proxy_pass_host}
                onChange={e => onChange("proxy_pass_host", e.target.value)}
                rows={2}
                spellCheck
                aria-required="true"
                onInput={e => {
                  const ta = e.currentTarget;
                  ta.style.height = "auto";
                  ta.style.height = ta.scrollHeight + "px";
                }}
              />
            </label>
            <label>
              Type
              <select
                value={editing.type}
                onChange={e => onChange("type", e.target.value as ProxyType)}
                aria-required="true"
              >
                <option value="PROXY">PROXY</option>
                <option value="REDIRECT">REDIRECT</option>
              </select>
            </label>
            <label>
              SSL
              <SslSwitch
                checked={editing.ssl}
                onChange={val => onChange("ssl", val)}
                id="modal-ssl-switch"
              />
            </label>
            <label>
              Custom Nginx Code
              <textarea
                ref={codeRef}
                value={editing.nginx_custom_code ?? ""}
                onChange={e => onChange("nginx_custom_code", e.target.value)}
                rows={5}
                spellCheck
                aria-multiline="true"
                placeholder="# Any custom Nginx config for this entry"
                onInput={e => {
                  const ta = e.currentTarget;
                  ta.style.height = "auto";
                  ta.style.height = ta.scrollHeight + "px";
                }}
              />
            </label>
            <div className={styles.modalActions}>
              <button
                onClick={onSave}
                disabled={loading}
                className={`${styles.button} ${styles.primary}`}
                aria-label="Save entry"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className={`${styles.button} ${styles.neutral}`}
                aria-label="Cancel"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => editing.id && onDelete(editing.id)}
                disabled={loading || !editing.id}
                className={`${styles.button} ${styles.danger}`}
                aria-label="Delete entry"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}