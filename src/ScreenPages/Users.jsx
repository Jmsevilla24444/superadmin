import React from "react";
import "../AdminDashboard.css";
import { IconSearch, IconTrash, IconMail } from "../icons";
import { db } from "../service/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";

// Search input component
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

const Users = () => {
  const [items, setItems] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [confirmId, setConfirmId] = React.useState(null);
  const [roleFilter, setRoleFilter] = React.useState("all"); // 'all' | 'admin' | 'student' | 'parents'
  const [sortKey, setSortKey] = React.useState("name");
  const [sortDir, setSortDir] = React.useState("asc");

  // Fetch real-time data from Firestore
  React.useEffect(() => {
    const adminCol = collection(db, "Admin");
    const unsubscribeAdmin = onSnapshot(adminCol, (snapshot) => {
      const adminData = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: d.uid,
          name: d.name,
          email: d.email,
          role: "admin",
          joined: d.createdAt?.toDate().toLocaleDateString() || "",
        };
      });

      const usersCol = collection(db, "users");
      const unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
        const usersData = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: d.uid,
            name: d.fullName || `${d.firstName} ${d.lastName}`,
            email: d.email,
            role: d.role,
            joined: d.createdAt?.toDate().toLocaleDateString() || "",
          };
        });

        setItems([...adminData, ...usersData]);
      });

      return () => unsubscribeUsers();
    });

    return () => unsubscribeAdmin();
  }, []);

  // Filter and sort
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [items, query]);

  const filteredByRole = React.useMemo(() => {
    if (roleFilter === "all") return filtered;
    return filtered.filter((u) => u.role.toLowerCase() === roleFilter);
  }, [filtered, roleFilter]);

  const sorted = React.useMemo(() => {
    const arr = [...filteredByRole];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredByRole, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const caret = (key) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const roleClass = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "ad-badge purple";
      case "student":
        return "ad-badge cyan";
      case "parents":
        return "ad-badge emerald";
      default:
        return "ad-badge gray";
    }
  };

  // Delete from Firestore with confirmation
  const doDelete = async (id) => {
    try {
      // Determine collection
      const user = items.find((u) => u.id === id);
      const collectionName = user.role === "admin" ? "Admin" : "users";

      // Delete from Firestore
      await deleteDoc(doc(db, collectionName, id));

      // Close confirmation modal
      setConfirmId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <section className="ad-section">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 className="ad-section-title" style={{ marginBottom: 8 }}>
          Users
        </h2>
        <div className="ad-form-actions">
          <button
            className="ad-btn ad-btn-accent"
            type="button"
            onClick={() => (window.location.hash = "#/su/enrollees")}
          >
            <span className="ad-btn-ico">
              <IconMail size={16} stroke="#fff" />
            </span>
            Enrollees
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
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
                Confirm Deletion
              </h3>
            </div>
            <div style={{ padding: 16, color: "#374151" }}>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </div>
            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                type="button"
                onClick={() => doDelete(confirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <SearchBox placeholder="Search users" value={query} onChange={setQuery} />

      {/* Role Filters */}
      <div className="ad-filter-row" role="group" aria-label="Role filters">
        {["all", "admin", "student", "parents"].map((role) => (
          <button
            key={role}
            type="button"
            className={`ad-chip ${roleFilter === role ? "active" : ""} ${
              role === "all"
                ? "gray"
                : role === "admin"
                ? "purple"
                : role === "student"
                ? "cyan"
                : "emerald"
            }`}
            onClick={() => setRoleFilter(role)}
          >
            <span className="dot" />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {/* Sorting */}
      <div className="ad-sort-row">
        <span style={{ color: "#6b7280", fontWeight: 600 }}>Sort:</span>
        <select
          className="ad-select"
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(":");
            setSortKey(k);
            setSortDir(d);
          }}
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="email:asc">Email A–Z</option>
          <option value="email:desc">Email Z–A</option>
          <option value="joined:desc">Joined Newest</option>
          <option value="joined:asc">Joined Oldest</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className="ad-th-btn"
                  onClick={() => toggleSort("name")}
                >
                  Name{caret("name")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="ad-th-btn"
                  onClick={() => toggleSort("email")}
                >
                  Email{caret("email")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="ad-th-btn"
                  onClick={() => toggleSort("role")}
                >
                  Role{caret("role")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="ad-th-btn"
                  onClick={() => toggleSort("joined")}
                >
                  Joined{caret("joined")}
                </button>
              </th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={roleClass(u.role)}>{u.role}</span>
                </td>
                <td>{u.joined}</td>
                <td className="ad-actions">
                  <button
                    className="ad-icon-btn danger"
                    title="Delete"
                    type="button"
                    onClick={() => setConfirmId(u.id)}
                  >
                    <IconTrash size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Users;
