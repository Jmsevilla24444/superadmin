import React, { useState, useEffect, useMemo } from "react";
import "../AdminDashboard.css";
import { IconSearch, IconEye, IconCheck } from "../icons";
import {
  collectionGroup,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../service/firebase";

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
  const [query, setQuery] = useState("");
  const [reportsA, setReportsA] = useState([]);
  const [confirmResolveA, setConfirmResolveA] = useState(null);
  const [confirmDeleteA, setConfirmDeleteA] = useState(null);
  const [viewReport, setViewReport] = useState(null); // For eye modal (title + desc + image)

  const [sortKeyA, setSortKeyA] = useState("created");
  const [sortDirA, setSortDirA] = useState("desc");
  const [statusA, setStatusA] = useState("All");

  // Load reports from all admins
  useEffect(() => {
    const q = collectionGroup(db, "reports");

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        refPath: d.ref.path,
        ...d.data(),
      }));
      setReportsA(list);
    });

    return () => unsub();
  }, []);

  const statusClass = (status) => {
    const s = String(status || "open").toLowerCase();
    if (s === "open") return "ad-badge rose";
    if (s === "in review") return "ad-badge amber";
    if (s === "resolved") return "ad-badge emerald";
    return "ad-badge gray";
  };

  // Filter reports
  const filtered = useMemo(() => {
    const qStr = query.trim().toLowerCase();
    let base = reportsA;

    if (qStr) {
      base = base.filter(
        (r) =>
          String(r.title || "")
            .toLowerCase()
            .includes(qStr) ||
          String(r.from || "")
            .toLowerCase()
            .includes(qStr) ||
          String(r.status || "")
            .toLowerCase()
            .includes(qStr),
      );
    }

    if (statusA !== "All") {
      base = base.filter(
        (r) => String(r.status || "").toLowerCase() === statusA.toLowerCase(),
      );
    }

    return base;
  }, [reportsA, query, statusA]);

  // Sort reports
  const sortedA = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDirA === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      const av =
        sortKeyA === "created"
          ? new Date(a.created || 0).getTime()
          : String(a[sortKeyA] || "").toLowerCase();
      const bv =
        sortKeyA === "created"
          ? new Date(b.created || 0).getTime()
          : String(b[sortKeyA] || "").toLowerCase();

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return arr;
  }, [filtered, sortKeyA, sortDirA]);

  const markResolvedA = async (report) => {
    if (!report.refPath) return;
    await updateDoc(doc(db, report.refPath), {
      status: "Resolved",
    });
    setConfirmResolveA(null);
  };

  const deleteReportA = async (report) => {
    if (!report.refPath) return;
    await deleteDoc(doc(db, report.refPath));
    setConfirmDeleteA(null);
  };

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Reports (from Admin)</h2>

      <SearchBox
        placeholder="Search reports"
        value={query}
        onChange={setQuery}
      />

      <div className="ad-filter-row">
        {["All", "Open", "In Review", "Resolved"].map((s) => (
          <button
            key={s}
            className={`ad-chip ${statusA === s ? "active" : ""}`}
            onClick={() => setStatusA(s)}
          >
            <span className="dot" />
            {s}
          </button>
        ))}
      </div>

      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>
                <button
                  className="ad-th-btn"
                  onClick={() => {
                    setSortDirA(
                      sortKeyA === "title" && sortDirA === "asc"
                        ? "desc"
                        : "asc",
                    );
                    setSortKeyA("title");
                  }}
                >
                  Title
                </button>
              </th>
              <th>From</th>
              <th>
                <button
                  className="ad-th-btn"
                  onClick={() => {
                    setSortDirA(
                      sortKeyA === "created" && sortDirA === "asc"
                        ? "desc"
                        : "asc",
                    );
                    setSortKeyA("created");
                  }}
                >
                  Created
                </button>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedA.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  No reports yet
                </td>
              </tr>
            ) : (
              sortedA.map((r) => (
                <tr key={r.id}>
                  <td>{r.title || "-"}</td>
                  <td>{r.from || "-"}</td>
                  <td>{r.created || "-"}</td>
                  <td>
                    <span className={statusClass(r.status)}>
                      {r.status || "Open"}
                    </span>
                  </td>
                  <td className="ad-actions">
                    {/* View report (description + image) */}
                    <button
                      className="ad-icon-btn"
                      onClick={() => setViewReport(r)}
                    >
                      <IconEye size={16} />
                    </button>

                    {/* Mark resolved */}
                    <button
                      className="ad-icon-btn"
                      onClick={() => setConfirmResolveA(r)}
                    >
                      <IconCheck size={16} />
                    </button>

                    {/* Delete report */}
                    <button
                      className="ad-icon-btn"
                      style={{ color: "red" }}
                      onClick={() => setConfirmDeleteA(r)}
                      title="Delete report"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve confirmation modal */}
      {confirmResolveA && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", borderRadius: 12, width: 420 }}>
            <div style={{ padding: 16 }}>Mark this report as Resolved?</div>
            <div className="ad-form-actions" style={{ padding: 16 }}>
              <button
                className="ad-btn"
                onClick={() => setConfirmResolveA(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                onClick={() => markResolvedA(confirmResolveA)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteA && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", borderRadius: 12, width: 420 }}>
            <div style={{ padding: 16 }}>Delete this report permanently?</div>
            <div className="ad-form-actions" style={{ padding: 16 }}>
              <button
                className="ad-btn"
                onClick={() => setConfirmDeleteA(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                style={{ backgroundColor: "red", color: "#fff" }}
                onClick={() => deleteReportA(confirmDeleteA)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report modal */}
      {viewReport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setViewReport(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90%",
              overflowY: "auto",
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h3 style={{ marginBottom: 8 }}>{viewReport.title}</h3>
            <p style={{ marginBottom: 16 }}>{viewReport.description}</p>
            {viewReport.image && (
              <img
                src={viewReport.image}
                alt="Report attachment"
                style={{ width: "100%", borderRadius: 8 }}
              />
            )}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="ad-btn" onClick={() => setViewReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reports;
