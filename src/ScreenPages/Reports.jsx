import React from "react";
import "../AdminDashboard.css";
import { IconSearch, IconEye, IconCheck } from "../icons";
import { DUMMY_REPORTS, DUMMY_CLIENT_REPORTS } from "../data";
const SearchBox = ({ placeholder, value, onChange }) => (
  <div className="ad-search">
    <span className="ad-search-ico" aria-hidden>
      <IconSearch size={16} />
    </span>
    <input
      className="ad-search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Reports = () => {
  const [query, setQuery] = React.useState("");
  const [queryClients, setQueryClients] = React.useState("");
  const [reportsA, setReportsA] = React.useState(DUMMY_REPORTS);
  const [reportsC, setReportsC] = React.useState(DUMMY_CLIENT_REPORTS);
  const [confirmResolveA, setConfirmResolveA] = React.useState(null);
  const [confirmResolveC, setConfirmResolveC] = React.useState(null);
  // Sorting state
  const [sortKeyA, setSortKeyA] = React.useState("created");
  const [sortDirA, setSortDirA] = React.useState("desc");
  const [sortKeyC, setSortKeyC] = React.useState("created");
  const [sortDirC, setSortDirC] = React.useState("desc");
  // Derived filters for Admin reports
  const [statusA, setStatusA] = React.useState("All"); // All | Open | In Review | Resolved
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = reportsA;
    if (q)
      base = base.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.from.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    if (statusA !== "All")
      base = base.filter(
        (r) => r.status.toLowerCase() === statusA.toLowerCase()
      );
    return base;
  }, [reportsA, query, statusA]);
  const sortedA = React.useMemo(() => {
    const arr = [...filtered];
    const dir = sortDirA === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const getVal = (o) =>
        sortKeyA === "created"
          ? new Date(o.created).getTime()
          : String(o[sortKeyA] ?? "").toLowerCase();
      const av = getVal(a),
        bv = getVal(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKeyA, sortDirA]);
  // Derived filters for Client reports
  const [statusC, setStatusC] = React.useState("All");
  const filteredClients = React.useMemo(() => {
    const q = queryClients.trim().toLowerCase();
    let base = reportsC;
    if (q)
      base = base.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.client.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    if (statusC !== "All")
      base = base.filter(
        (r) => r.status.toLowerCase() === statusC.toLowerCase()
      );
    return base;
  }, [reportsC, queryClients, statusC]);
  const sortedC = React.useMemo(() => {
    const arr = [...filteredClients];
    const dir = sortDirC === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const getVal = (o) =>
        sortKeyC === "created"
          ? new Date(o.created).getTime()
          : String(o[sortKeyC] ?? "").toLowerCase();
      const av = getVal(a),
        bv = getVal(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredClients, sortKeyC, sortDirC]);
  const caret = (activeKey, key, dir) =>
    activeKey === key ? (dir === "asc" ? " ▲" : " ▼") : "";

  const statusClass = (status) => {
    const s = String(status).toLowerCase();
    if (s === "open") return "ad-badge rose";
    if (s === "in review") return "ad-badge amber";
    if (s === "resolved") return "ad-badge emerald";
    return "ad-badge gray";
  };

  const markResolvedA = (id) => {
    setReportsA((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r))
    );
    setConfirmResolveA(null);
  };
  const markResolvedC = (id) => {
    setReportsC((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r))
    );
    setConfirmResolveC(null);
  };

  return (
    <>
      <section className="ad-section">
        <h2 className="ad-section-title">Reports (from Admin)</h2>
        <SearchBox
          placeholder="Search reports"
          value={query}
          onChange={setQuery}
        />
        <div
          className="ad-filter-row"
          role="group"
          aria-label="Admin report filters"
        >
          <button
            type="button"
            className={`ad-chip ${statusA === "All" ? "active" : ""} gray`}
            onClick={() => setStatusA("All")}
          >
            <span className="dot" />
            All
          </button>
          <button
            type="button"
            className={`ad-chip ${statusA === "Open" ? "active" : ""} rose`}
            onClick={() => setStatusA("Open")}
          >
            <span className="dot" />
            Open
          </button>
          <button
            type="button"
            className={`ad-chip ${
              statusA === "In Review" ? "active" : ""
            } amber`}
            onClick={() => setStatusA("In Review")}
          >
            <span className="dot" />
            In Review
          </button>
          <button
            type="button"
            className={`ad-chip ${
              statusA === "Resolved" ? "active" : ""
            } emerald`}
            onClick={() => setStatusA("Resolved")}
          >
            <span className="dot" />
            Resolved
          </button>
        </div>
        <div className="ad-table-card">
          <table className="ad-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirA(
                        sortKeyA === "title" && sortDirA === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyA("title");
                    }}
                  >
                    Title{caret(sortKeyA, "title", sortDirA)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirA(
                        sortKeyA === "from" && sortDirA === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyA("from");
                    }}
                  >
                    From{caret(sortKeyA, "from", sortDirA)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirA(
                        sortKeyA === "created" && sortDirA === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyA("created");
                    }}
                  >
                    Created{caret(sortKeyA, "created", sortDirA)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirA(
                        sortKeyA === "status" && sortDirA === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyA("status");
                    }}
                  >
                    Status{caret(sortKeyA, "status", sortDirA)}
                  </button>
                </th>
                <th className="ad-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedA.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.from}</td>
                  <td>{r.created}</td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="ad-actions">
                    <button className="ad-icon-btn" title="View" type="button">
                      <IconEye size={16} />
                    </button>
                    <button
                      className="ad-icon-btn"
                      title="Mark Resolved"
                      type="button"
                      onClick={() => setConfirmResolveA(r.id)}
                    >
                      <IconCheck size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {confirmResolveA !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 60,
            }}
          >
            <div
              style={{
                width: 420,
                maxWidth: "92vw",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,.18)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ padding: 16, borderBottom: "1px solid #eef2f7" }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                  Confirm Resolve
                </h3>
              </div>
              <div style={{ padding: 16, color: "#374151" }}>
                Mark this admin report as Resolved?
              </div>
              <div
                className="ad-form-actions"
                style={{ justifyContent: "flex-end", padding: 16 }}
              >
                <button
                  className="ad-btn"
                  type="button"
                  onClick={() => setConfirmResolveA(null)}
                >
                  Cancel
                </button>
                <button
                  className="ad-btn ad-btn-primary"
                  type="button"
                  onClick={() => markResolvedA(confirmResolveA)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="ad-section">
        <h2 className="ad-section-title">Reports (from Student/Parent)</h2>
        <SearchBox
          placeholder="Search client reports"
          value={queryClients}
          onChange={setQueryClients}
        />
        <div
          className="ad-filter-row"
          role="group"
          aria-label="Client report filters"
        >
          <button
            type="button"
            className={`ad-chip ${statusC === "All" ? "active" : ""} gray`}
            onClick={() => setStatusC("All")}
          >
            <span className="dot" />
            All
          </button>
          <button
            type="button"
            className={`ad-chip ${statusC === "Open" ? "active" : ""} rose`}
            onClick={() => setStatusC("Open")}
          >
            <span className="dot" />
            Open
          </button>
          <button
            type="button"
            className={`ad-chip ${
              statusC === "In Review" ? "active" : ""
            } amber`}
            onClick={() => setStatusC("In Review")}
          >
            <span className="dot" />
            In Review
          </button>
          <button
            type="button"
            className={`ad-chip ${
              statusC === "Resolved" ? "active" : ""
            } emerald`}
            onClick={() => setStatusC("Resolved")}
          >
            <span className="dot" />
            Resolved
          </button>
        </div>
        <div className="ad-table-card">
          <table className="ad-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirC(
                        sortKeyC === "title" && sortDirC === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyC("title");
                    }}
                  >
                    Title{caret(sortKeyC, "title", sortDirC)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirC(
                        sortKeyC === "client" && sortDirC === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyC("client");
                    }}
                  >
                    Client{caret(sortKeyC, "client", sortDirC)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirC(
                        sortKeyC === "created" && sortDirC === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyC("created");
                    }}
                  >
                    Created{caret(sortKeyC, "created", sortDirC)}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="ad-th-btn"
                    onClick={() => {
                      setSortDirC(
                        sortKeyC === "status" && sortDirC === "asc"
                          ? "desc"
                          : "asc"
                      );
                      setSortKeyC("status");
                    }}
                  >
                    Status{caret(sortKeyC, "status", sortDirC)}
                  </button>
                </th>
                <th className="ad-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedC.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.client}</td>
                  <td>{r.created}</td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="ad-actions">
                    <button className="ad-icon-btn" title="View" type="button">
                      <IconEye size={16} />
                    </button>
                    <button
                      className="ad-icon-btn"
                      title="Mark Resolved"
                      type="button"
                      onClick={() => setConfirmResolveC(r.id)}
                    >
                      <IconCheck size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {confirmResolveC !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 60,
            }}
          >
            <div
              style={{
                width: 420,
                maxWidth: "92vw",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,.18)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ padding: 16, borderBottom: "1px solid #eef2f7" }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                  Confirm Resolve
                </h3>
              </div>
              <div style={{ padding: 16, color: "#374151" }}>
                Mark this client report as Resolved?
              </div>
              <div
                className="ad-form-actions"
                style={{ justifyContent: "flex-end", padding: 16 }}
              >
                <button
                  className="ad-btn"
                  type="button"
                  onClick={() => setConfirmResolveC(null)}
                >
                  Cancel
                </button>
                <button
                  className="ad-btn ad-btn-primary"
                  type="button"
                  onClick={() => markResolvedC(confirmResolveC)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Reports;
