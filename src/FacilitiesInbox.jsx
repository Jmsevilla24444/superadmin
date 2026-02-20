import React from "react";
import "./AdminDashboard.css";
import { IconSearch, IconEye, IconCheck, IconTrash } from "./icons";
import { db } from "./service/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

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

const fmtTS = (ts) => {
  try {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
};

const getStatus = (item) => {
  // ✅ supports BOTH schemas:
  // New schema: status: "pending"|"resolved"|"rejected"
  // Old schema: approved: boolean
  if (item?.status) return String(item.status);
  if (typeof item?.approved === "boolean")
    return item.approved ? "resolved" : "pending";
  return "pending";
};

const FacilitiesInbox = () => {
  const [queryText, setQueryText] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("pending"); // pending|resolved|rejected|all

  // ✅ sorting
  const [sortBy, setSortBy] = React.useState("newest"); // newest|oldest|name_az|name_za|status|pending_first

  const [viewItem, setViewItem] = React.useState(null);
  const [approveItem, setApproveItem] = React.useState(null);

  const [rejectItem, setRejectItem] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // ✅ LIVE Firestore listener
  React.useEffect(() => {
    const q = query(
      collection(db, "incomingFacilities"),
      orderBy("submittedAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(list);
      },
      (err) => {
        console.error("❌ incomingFacilities listener error:", err);
      },
    );

    return () => unsub();
  }, []);

  const typeOptions = React.useMemo(() => {
    const set = new Set(items.map((x) => x.type).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = queryText.trim().toLowerCase();

    return items
      .filter((x) => {
        if (statusFilter === "all") return true;
        return getStatus(x) === statusFilter;
      })
      .filter((x) => {
        if (typeFilter === "All") return true;
        return String(x.type || "") === typeFilter;
      })
      .filter((x) => {
        if (!q) return true;
        const blob = [
          x.name,
          x.type,
          x.submittedBy,
          x.floor,
          x.location,
          x.notes,
          getStatus(x),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
  }, [items, queryText, typeFilter, statusFilter]);

  // ✅ sorting helpers
  const getSortTime = (x) => {
    const ts =
      x?.submittedAt || x?.createdAt || x?.timestamp || x?.updatedAt || null;

    if (!ts) return 0;
    if (typeof ts === "number") return ts;
    if (ts?.toDate) return ts.toDate().getTime();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const statusRank = (s) => {
    // lower = higher priority
    if (s === "pending") return 0;
    if (s === "rejected") return 1;
    if (s === "resolved") return 2;
    return 9;
  };

  const sorted = React.useMemo(() => {
    const arr = [...filtered];

    arr.sort((a, b) => {
      if (sortBy === "newest") return getSortTime(b) - getSortTime(a);
      if (sortBy === "oldest") return getSortTime(a) - getSortTime(b);

      if (sortBy === "name_az")
        return String(a?.name || "").localeCompare(String(b?.name || ""));
      if (sortBy === "name_za")
        return String(b?.name || "").localeCompare(String(a?.name || ""));

      if (sortBy === "status")
        return String(getStatus(a)).localeCompare(String(getStatus(b)));

      if (sortBy === "pending_first") {
        const ra = statusRank(getStatus(a));
        const rb = statusRank(getStatus(b));
        if (ra !== rb) return ra - rb;
        // tie-breaker: newest
        return getSortTime(b) - getSortTime(a);
      }

      return 0;
    });

    return arr;
  }, [filtered, sortBy]);

  const approveSubmission = async (item) => {
    await updateDoc(doc(db, "incomingFacilities", item.id), {
      approved: true,
      status: "resolved",
      resolvedAt: serverTimestamp(),
      resolvedBy: "SuperAdmin",
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: "",
    });
  };

  const rejectSubmission = async (item, reason) => {
    await updateDoc(doc(db, "incomingFacilities", item.id), {
      approved: false,
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: "SuperAdmin",
      rejectionReason: String(reason || "").trim(),
      resolvedAt: null,
      resolvedBy: null,
    });
  };

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Incoming Facilities (from Admin)</h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <SearchBox
          placeholder="Search facilities"
          value={queryText}
          onChange={setQueryText}
        />

        {/* ✅ SORT DROPDOWN */}
        <div style={{ minWidth: 220 }}>
          <select
            className="ad-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort"
          >
            <option value="newest">Sort: Newest first</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="pending_first">Sort: Pending first</option>
            <option value="name_az">Sort: Name A → Z</option>
            <option value="name_za">Sort: Name Z → A</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>

        <div
          className="ad-filter-row"
          role="group"
          aria-label="Status filters"
          style={{ margin: 0 }}
        >
          {["pending", "resolved", "rejected", "all"].map((s) => (
            <button
              key={s}
              type="button"
              className={`ad-chip ${statusFilter === s ? "active" : ""} ${
                s === "pending"
                  ? "emerald"
                  : s === "rejected"
                    ? "red"
                    : "gray"
              }`}
              onClick={() => setStatusFilter(s)}
            >
              <span className="dot" />
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="ad-filter-row" role="group" aria-label="Type filters">
        {typeOptions.map((t) => (
          <button
            key={t}
            type="button"
            className={`ad-chip ${typeFilter === t ? "active" : ""} ${
              t === "All" ? "gray" : "emerald"
            }`}
            onClick={() => setTypeFilter(t)}
          >
            <span className="dot" />
            {t}
          </button>
        ))}
      </div>

      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Type</th>
              <th>Submitted By</th>
              <th>Submitted At</th>
              <th>Status</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const status = getStatus(f);
              return (
                <tr key={f.id}>
                  <td>{f.name || "-"}</td>
                  <td>{f.type || "-"}</td>
                  <td>{f.submittedBy || "-"}</td>
                  <td>{fmtTS(f.submittedAt) || "-"}</td>
                  <td>{status}</td>
                  <td className="ad-actions">
                    <button
                      className="ad-icon-btn"
                      title="View"
                      type="button"
                      onClick={() => setViewItem(f)}
                    >
                      <IconEye size={16} />
                    </button>

                    <button
                      className="ad-icon-btn"
                      title="Approve"
                      type="button"
                      disabled={status !== "pending"}
                      onClick={() => setApproveItem(f)}
                      style={
                        status !== "pending"
                          ? { opacity: 0.4, cursor: "not-allowed" }
                          : undefined
                      }
                    >
                      <IconCheck size={16} />
                    </button>

                    <button
                      className="ad-icon-btn danger"
                      title="Reject"
                      type="button"
                      disabled={status !== "pending"}
                      onClick={() => {
                        setRejectItem(f);
                        setRejectReason("");
                      }}
                      style={
                        status !== "pending"
                          ? { opacity: 0.4, cursor: "not-allowed" }
                          : undefined
                      }
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 18,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
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
              width: 760,
              maxWidth: "96vw",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                View Facility Submission
              </h3>
              <button
                className="ad-btn"
                type="button"
                onClick={() => setViewItem(null)}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: 16,
                padding: 16,
              }}
            >
              <div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#f9fafb",
                    minHeight: 260,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {viewItem.imageUrl ? (
                    <img
                      src={viewItem.imageUrl}
                      alt="facility"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : viewItem.image ? (
                    <img
                      src={viewItem.image}
                      alt="facility"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{ color: "#6b7280", padding: 18 }}>
                      No image provided.
                    </div>
                  )}
                </div>

                {viewItem.notes ? (
                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: 6,
                      }}
                    >
                      Notes
                    </div>
                    <div style={{ color: "#374151", whiteSpace: "pre-wrap" }}>
                      {viewItem.notes}
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {viewItem.name}
                </div>
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  {viewItem.type || "-"}
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>
                      Submitted By
                    </div>
                    <div style={{ color: "#374151" }}>
                      {viewItem.submittedBy || "-"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>
                      Submitted At
                    </div>
                    <div style={{ color: "#374151" }}>
                      {fmtTS(viewItem.submittedAt) || "-"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>
                      Status
                    </div>
                    <div style={{ color: "#374151" }}>
                      {getStatus(viewItem)}
                    </div>
                  </div>

                  {getStatus(viewItem) === "rejected" ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        Rejection Reason
                      </div>
                      <div style={{ color: "#374151" }}>
                        {viewItem.rejectionReason || "-"}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  className="ad-form-actions"
                  style={{ justifyContent: "flex-end", marginTop: 16 }}
                >
                  <button
                    className="ad-btn"
                    type="button"
                    onClick={() => setViewItem(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRM */}
      {approveItem && (
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
                Confirm Approval
              </h3>
            </div>
            <div style={{ padding: 16, color: "#374151" }}>
              Approve <b>{approveItem.name}</b>? This will mark it as{" "}
              <b>resolved</b>.
            </div>
            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setApproveItem(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                type="button"
                onClick={async () => {
                  try {
                    await approveSubmission(approveItem);
                    setApproveItem(null);
                  } catch (err) {
                    console.error("Approve error:", err);
                    alert("Failed to approve. Check console for details.");
                  }
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectItem && (
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
              width: 520,
              maxWidth: "92vw",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #eef2f7" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                Reject Submission
              </h3>
            </div>
            <div style={{ padding: 16, color: "#374151" }}>
              Reject <b>{rejectItem.name}</b>? (Optional: add a reason)
              <textarea
                className="ad-input"
                style={{ marginTop: 12, minHeight: 90, resize: "vertical" }}
                placeholder="Reason (optional)…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setRejectItem(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                type="button"
                onClick={async () => {
                  try {
                    await rejectSubmission(rejectItem, rejectReason);
                    setRejectItem(null);
                    setRejectReason("");
                  } catch (err) {
                    console.error("Reject error:", err);
                    alert("Failed to reject. Check console for details.");
                  }
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FacilitiesInbox;
