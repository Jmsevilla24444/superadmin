import React from "react";
import "../AdminDashboard.css";
import { IconSearch, IconTrash, IconMail, IconCalendar } from "../icons";
import { db } from "../service/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  addDoc,

  // ✅ added for cascade cleanup
  query,
  where,
  getDocs,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// -----------------------------
// Helpers (top-level for stable hook deps)
// -----------------------------
const normalizeRole = (role) => {
  const r = String(role || "")
    .toLowerCase()
    .trim();
  if (r === "parent") return "parents";
  return r;
};

const isParent = (u) => normalizeRole(u?.role) === "parents";
const isAdmin = (u) => normalizeRole(u?.role) === "admin";
const isStudent = (u) => normalizeRole(u?.role) === "student";

const isRejectedUser = (u) =>
  String(u?.status || "")
    .toLowerCase()
    .trim() === "rejected";

const isPendingEmail = (u) =>
  u && !isAdmin(u) && !isRejectedUser(u) && u.emailVerified !== true;

const isPendingAdmin = (u) =>
  u &&
  !isAdmin(u) &&
  !isRejectedUser(u) &&
  u.emailVerified === true &&
  u.adminApproved !== true;

const isApprovedUser = (u) =>
  u &&
  !isAdmin(u) &&
  !isRejectedUser(u) &&
  u.emailVerified === true &&
  u.adminApproved === true;

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

// Simple modal shell (used by notice + confirm + rejected list)
const ModalShell = ({ zIndex = 80, onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex,
      padding: 16,
    }}
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

// Dashboard-like category card (clickable)
const CategoryStat = ({
  title,
  subtitle,
  value,
  icon,
  variant = "indigo",
  active = false,
  onClick,
}) => (
  <button
    type="button"
    className={`ad-stat ad-stat-click ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <div className={`ad-stat-badge ${variant}`} aria-hidden>
      {icon}
    </div>
    <div className="ad-stat-body">
      <div className="ad-stat-title" style={{ marginLeft: 72 }}>
        {title}
      </div>
      <div className="ad-stat-value" style={{ marginLeft: 72 }}>
        {value}
      </div>
      {subtitle ? (
        <div
          style={{
            marginLeft: 72,
            marginTop: 4,
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 600,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  </button>
);

const Users = () => {
  const [items, setItems] = React.useState([]);
  const [queryText, setQueryText] = React.useState("");

  const [viewUser, setViewUser] = React.useState(null);
  const [isApproving, setIsApproving] = React.useState(false);

  const [roleFilter, setRoleFilter] = React.useState("all"); // 'all' | 'admin' | 'student' | 'parents'

  // dashboard-like category filter for user status
  // 'all' | 'pendingEmail' | 'pendingAdmin' | 'approved'
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState("name");
  const [sortDir, setSortDir] = React.useState("asc");

  // rejected users modal screen
  const [showRejectedModal, setShowRejectedModal] = React.useState(false);

  // modal-based notices + confirmations (replace alert/confirm)
  const [notice, setNotice] = React.useState(null); // { title, message }
  const [confirm, setConfirm] = React.useState(null); // { title, message, confirmText, danger, onConfirm }

  // Delete confirmation (id + optional context)
  const [confirmDelete, setConfirmDelete] = React.useState(null); // { id, from: 'main'|'rejected' }

  // ID preview (zoom/pan)
  const [previewImage, setPreviewImage] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const lastPanRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!isPanning) lastPanRef.current = pan;
  }, [isPanning, pan]);

  const showNotice = (title, message) => setNotice({ title, message });

  const showConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    danger = false,
    onConfirm,
  }) => setConfirm({ title, message, confirmText, danger, onConfirm });

  // Fetch real-time data from Firestore
  React.useEffect(() => {
    const adminCol = collection(db, "Admin");
    const unsubscribeAdmin = onSnapshot(adminCol, (snapshot) => {
      const adminData = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.uid,
          uid: d.uid,
          name: d.name || "(No name)",
          email: d.email || "",
          role: "admin",
          joined: d.createdAt?.toDate().toLocaleDateString() || "",
          createdAt: d.createdAt || null,

          // fields for view modal compatibility
          firstName: "",
          lastName: "",
          fullName: d.name || "",
          idNumber: "",
          photoURL: "",
          emailVerified: true,
          adminApproved: true,
          status: "approved",
          rejected: false,

          // who added the parent (only for parents)
          addedByStudentUid: "",
          addedByStudentName: "",
          addedByStudentEmail: "",
        };
      });

      const usersCol = collection(db, "users");
      const unsubscribeUsers = onSnapshot(usersCol, (snapshot2) => {
        const usersData = snapshot2.docs.map((docSnap) => {
          const d = docSnap.data();
          const fullName =
            d.fullName ||
            `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
            "(No name)";

          const statusLower = String(d.status || "")
            .toLowerCase()
            .trim();
          const role = normalizeRole(d.role || "student");

          return {
            id: d.uid,
            uid: d.uid,
            name: fullName,
            email: d.email || "",
            role,
            joined: d.createdAt?.toDate().toLocaleDateString() || "",
            createdAt: d.createdAt || null,

            // extras for viewing/approval
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            fullName,
            idNumber: d.idNumber || "",
            photoURL: d.photoURL || "",
            emailVerified: d.emailVerified === true,
            adminApproved: d.adminApproved === true,
            status: d.status || "",

            // who added the parent (only meaningful when role=parent)
            addedByStudentUid: d.addedByStudentUid || "",
            addedByStudentName: d.addedByStudentName || "",
            addedByStudentEmail: d.addedByStudentEmail || "",

            rejected: statusLower === "rejected" || d.rejected === true,
          };
        });

        setItems([...adminData, ...usersData]);
      });

      return () => unsubscribeUsers();
    });

    return () => unsubscribeAdmin();
  }, []);

  const rejectedUsers = React.useMemo(() => {
    return items.filter((u) => !isAdmin(u) && isRejectedUser(u));
  }, [items]);

  // Main list: always exclude rejected users
  const filtered = React.useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return items.filter((u) => {
      if (isRejectedUser(u)) return false; // ALWAYS hidden in main table

      if (!q) return true;
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const role = String(u.role || "").toLowerCase();
      const status = String(u.status || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        status.includes(q)
      );
    });
  }, [items, queryText]);

  const filteredByRole = React.useMemo(() => {
    if (roleFilter === "all") return filtered;

    if (roleFilter === "parents") return filtered.filter((u) => isParent(u));
    if (roleFilter === "admin") return filtered.filter((u) => isAdmin(u));
    if (roleFilter === "student") return filtered.filter((u) => isStudent(u));

    return filtered.filter(
      (u) =>
        String(u.role || "")
          .toLowerCase()
          .trim() === String(roleFilter).toLowerCase().trim(),
    );
  }, [filtered, roleFilter]);

  const filteredByRoleAndStatus = React.useMemo(() => {
    if (statusFilter === "all") return filteredByRole;
    if (statusFilter === "pendingEmail")
      return filteredByRole.filter((u) => isPendingEmail(u));
    if (statusFilter === "pendingAdmin")
      return filteredByRole.filter((u) => isPendingAdmin(u));
    if (statusFilter === "approved")
      return filteredByRole.filter((u) => isApprovedUser(u));
    return filteredByRole;
  }, [filteredByRole, statusFilter]);

  // Dashboard counts
  const totalActiveCount = React.useMemo(() => filtered.length, [filtered]);
  const adminsCount = React.useMemo(
    () => filtered.filter((u) => isAdmin(u)).length,
    [filtered],
  );
  const studentsCount = React.useMemo(
    () => filtered.filter((u) => isStudent(u)).length,
    [filtered],
  );
  const parentsCount = React.useMemo(
    () => filtered.filter((u) => isParent(u)).length,
    [filtered],
  );
  const pendingEmailCount = React.useMemo(
    () => filtered.filter((u) => isPendingEmail(u)).length,
    [filtered],
  );
  const pendingAdminCount = React.useMemo(
    () => filtered.filter((u) => isPendingAdmin(u)).length,
    [filtered],
  );
  const approvedCount = React.useMemo(
    () => filtered.filter((u) => isApprovedUser(u)).length,
    [filtered],
  );

  const sorted = React.useMemo(() => {
    const arr = [...filteredByRoleAndStatus];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredByRoleAndStatus, sortKey, sortDir]);

  const rejectedSorted = React.useMemo(() => {
    const arr = [...rejectedUsers];
    arr.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
    return arr;
  }, [rejectedUsers]);

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
    const r = normalizeRole(role);
    switch (r) {
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

  const statusPill = (u) => {
    if (!u || isAdmin(u)) return null;

    if (isRejectedUser(u)) {
      return <span className="ad-badge gray">Rejected</span>;
    }

    const emailOk = u.emailVerified === true;
    const adminOk = u.adminApproved === true;

    let label = "Approved";
    let cls = "ad-badge emerald";

    if (!emailOk) {
      label = "Pending Email";
      cls = "ad-badge gray";
    } else if (emailOk && !adminOk) {
      label = "Pending Admin";
      cls = "ad-badge cyan";
    }

    return <span className={cls}>{label}</span>;
  };

  const getCallable = () => {
    try {
      const functions = getFunctions();
      return {
        deleteUserCompletely: httpsCallable(functions, "deleteUserCompletely"),
        adminDeleteAuthUserByUid: httpsCallable(
          functions,
          "adminDeleteAuthUserByUid",
        ),
      };
    } catch {
      return null;
    }
  };

  // ✅ Cascade cleanup helper:
  // When deleting a parent, remove parent UID from all students.linkedParents (prevents student Inbox stuck)
  const cleanupParentLinks = async (parentUid) => {
    if (!parentUid) return;
    try {
      const q = query(
        collection(db, "users"),
        where("linkedParents", "array-contains", parentUid),
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      let batch = writeBatch(db);
      let count = 0;

      for (const d of snap.docs) {
        batch.update(d.ref, { linkedParents: arrayRemove(parentUid) });
        count++;

        if (count >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) await batch.commit();
    } catch (e) {
      console.error("cleanupParentLinks error:", e);
      // do not throw; still proceed with deletion
    }
  };

  // ✅ Delete user (Cloud Function first; Firestore fallback) + parent link cleanup
  const doDelete = async (id) => {
    try {
      const user = items.find((u) => u.id === id);
      if (!user) {
        setConfirmDelete(null);
        return;
      }

      const uid = user.uid || user.id;
      const role = normalizeRole(user.role || "student");

      // ✅ If deleting a parent, cleanup linkedParents in student docs first
      if (role === "parents") {
        await cleanupParentLinks(uid);
      }

      const callable = getCallable();

      // Try full deletion first (Firestore + Auth + Storage)
      if (callable?.deleteUserCompletely) {
        try {
          await callable.deleteUserCompletely({ uid, role });
          setConfirmDelete(null);
          return;
        } catch (err) {
          console.warn(
            "deleteUserCompletely failed; falling back to Firestore-only:",
            err,
          );
        }
      }

      // Firestore-only fallback
      const collectionName = isAdmin(user) ? "Admin" : "users";
      await deleteDoc(doc(db, collectionName, id));
      setConfirmDelete(null);

      showNotice(
        "Deleted (Firestore only)",
        role === "parents"
          ? "Parent was deleted and student links were cleaned up. Students will not be stuck on Inbox loading."
          : "The Firestore record was deleted. Note: the Firebase Auth account (email reuse) and Storage ID image are NOT deleted unless you deploy the Cloud Function deleteUserCompletely.",
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      showNotice("Delete failed", "Failed to delete user. Please try again.");
    }
  };

  // Approve user (student/parent)
  const approveUser = async (u) => {
    if (!u) return;
    if (isAdmin(u)) return;
    if (!(isStudent(u) || isParent(u))) return;

    if (isRejectedUser(u)) {
      showNotice(
        "Not allowed",
        "This user is already rejected. Approval is disabled.",
      );
      return;
    }

    if (u.emailVerified !== true) {
      showNotice("Not allowed", "Cannot approve: email is not verified yet.");
      return;
    }

    if (u.adminApproved === true) return;

    try {
      setIsApproving(true);

      await updateDoc(doc(db, "users", u.id), {
        adminApproved: true,
        status: "approved",
        approvedAt: serverTimestamp(),
        rejectedAt: null,
      });

      // Optional: Trigger Email Extension
      try {
        if (u.email) {
          await addDoc(collection(db, "mail"), {
            to: u.email,
            message: {
              subject: "Your account is approved",
              text: "Your account has been approved. You can now log in to PMFTCI360.",
            },
          });
        }
      } catch (mailErr) {
        console.warn("Mail trigger failed (extension not set up?):", mailErr);
      }

      setViewUser((prev) =>
        prev
          ? {
              ...prev,
              adminApproved: true,
              status: "approved",
              rejected: false,
            }
          : prev,
      );
    } catch (e) {
      console.error("Approve failed:", e);
      showNotice("Approve failed", "Failed to approve user. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  // Execute rejection (called only after confirm modal)
  const rejectUserConfirmed = async (u) => {
    try {
      setIsApproving(true);

      // 1) Update Firestore user record first (audit trail)
      await updateDoc(doc(db, "users", u.id), {
        adminApproved: false,
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // 2) Send email via Trigger Email extension
      try {
        if (u.email) {
          await addDoc(collection(db, "mail"), {
            to: u.email,
            message: {
              subject: "Your account verification was rejected",
              text: "Your submitted verification was rejected during review. You may sign up again using the same email once your previous account is fully removed by the administrator.",
            },
          });
        }
      } catch (mailErr) {
        console.warn("Mail trigger failed (extension not set up?):", mailErr);
      }

      // 3) Delete Auth user to free email (Admin SDK via callable)
      const callable = getCallable();
      if (callable?.adminDeleteAuthUserByUid) {
        try {
          await callable.adminDeleteAuthUserByUid({ uid: u.uid || u.id });
        } catch (err) {
          console.warn("adminDeleteAuthUserByUid failed:", err);
          showNotice(
            "Rejected (Auth not deleted)",
            "User was tagged as rejected, but Firebase Auth account could not be deleted. To allow the same Gmail to sign up again, deploy Cloud Function adminDeleteAuthUserByUid (Admin SDK).",
          );
        }
      } else {
        showNotice(
          "Rejected (Auth not deleted)",
          "User was tagged as rejected. To allow the same Gmail to sign up again, deploy Cloud Function adminDeleteAuthUserByUid (Admin SDK) to delete the Firebase Auth user.",
        );
      }

      setViewUser((prev) =>
        prev
          ? {
              ...prev,
              adminApproved: false,
              status: "rejected",
              rejected: true,
            }
          : prev,
      );
    } catch (e) {
      console.error("Reject failed:", e);
      showNotice("Reject failed", "Failed to reject user. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  // Reject user (opens confirm modal instead of window.confirm)
  const rejectUser = async (u) => {
    if (!u) return;
    if (isAdmin(u)) return;
    if (!(isStudent(u) || isParent(u))) return;

    if (u.emailVerified !== true) {
      showNotice("Not allowed", "Cannot reject: email is not verified yet.");
      return;
    }

    if (isRejectedUser(u)) return;

    showConfirm({
      title: isParent(u) ? "Reject parent account" : "Reject student ID",
      message:
        "Reject this account?\n\nThis will tag the record as rejected.\n\nTo allow the same Gmail to sign up again, the Firebase Auth account must be deleted (requires Cloud Function adminDeleteAuthUserByUid).",
      confirmText: "Reject",
      danger: true,
      onConfirm: async () => {
        const target = u;
        setConfirm(null);
        await rejectUserConfirmed(target);
      },
    });
  };

  const isRejected =
    viewUser &&
    String(viewUser.status || "")
      .toLowerCase()
      .trim() === "rejected";

  const isApprovable = (u) => u && (isStudent(u) || isParent(u));

  const canApprove =
    viewUser &&
    isApprovable(viewUser) &&
    viewUser.emailVerified === true &&
    viewUser.adminApproved !== true &&
    !isRejected;

  const canReject =
    viewUser &&
    isApprovable(viewUser) &&
    viewUser.emailVerified === true &&
    viewUser.adminApproved !== true &&
    !isRejected;

  return (
    <section className="ad-section">
      {/* NOTICE MODAL */}
      {notice && (
        <ModalShell zIndex={120} onClose={() => setNotice(null)}>
          <div
            style={{
              width: 460,
              maxWidth: "92vw",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #eef2f7" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                {notice.title}
              </h3>
            </div>
            <div
              style={{ padding: 16, color: "#374151", whiteSpace: "pre-wrap" }}
            >
              {notice.message}
            </div>
            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setNotice(null)}
              >
                OK
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* CONFIRM MODAL */}
      {confirm && (
        <ModalShell zIndex={121} onClose={() => setConfirm(null)}>
          <div
            style={{
              width: 480,
              maxWidth: "92vw",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #eef2f7" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                {confirm.title}
              </h3>
            </div>
            <div
              style={{ padding: 16, color: "#374151", whiteSpace: "pre-wrap" }}
            >
              {confirm.message}
            </div>
            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16, gap: 10 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={`ad-btn ${confirm.danger ? "ad-btn-primary" : ""}`}
                type="button"
                onClick={async () => {
                  const fn = confirm.onConfirm;
                  setConfirm(null);
                  if (fn) await fn();
                }}
                style={
                  confirm.danger
                    ? {
                        borderColor: "#ef4444",
                        background: "#ef4444",
                        color: "#fff",
                      }
                    : undefined
                }
              >
                {confirm.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 className="ad-section-title" style={{ marginBottom: 8 }}>
          Users
        </h2>

        <button
          type="button"
          className="ad-btn"
          onClick={() => setShowRejectedModal(true)}
          title="View rejected accounts"
          style={{ whiteSpace: "nowrap" }}
        >
          Rejected Users ({rejectedUsers.length})
        </button>
      </div>

      {/* Dashboard-like categories */}
      <div
        className="ad-stats"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          marginTop: 10,
          marginBottom: 12,
        }}
      >
        <CategoryStat
          title="All Active"
          value={totalActiveCount}
          subtitle="Excludes rejected"
          icon={<IconCalendar />}
          variant="indigo"
          active={roleFilter === "all" && statusFilter === "all"}
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("all");
          }}
        />
        <CategoryStat
          title="Admins"
          value={adminsCount}
          icon={<IconCalendar />}
          variant="violet"
          active={roleFilter === "admin" && statusFilter === "all"}
          onClick={() => {
            setRoleFilter("admin");
            setStatusFilter("all");
          }}
        />
        <CategoryStat
          title="Students"
          value={studentsCount}
          icon={<IconCalendar />}
          variant="blue"
          active={roleFilter === "student" && statusFilter === "all"}
          onClick={() => {
            setRoleFilter("student");
            setStatusFilter("all");
          }}
        />
        <CategoryStat
          title="Parents"
          value={parentsCount}
          icon={<IconCalendar />}
          variant="emerald"
          active={roleFilter === "parents" && statusFilter === "all"}
          onClick={() => {
            setRoleFilter("parents");
            setStatusFilter("all");
          }}
        />
        <CategoryStat
          title="Pending Email"
          value={pendingEmailCount}
          subtitle="Not verified"
          icon={<IconMail />}
          variant="amber"
          active={roleFilter === "all" && statusFilter === "pendingEmail"}
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("pendingEmail");
          }}
        />
        <CategoryStat
          title="Pending Admin"
          value={pendingAdminCount}
          subtitle="Email verified"
          icon={<IconMail />}
          variant="rose"
          active={roleFilter === "all" && statusFilter === "pendingAdmin"}
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("pendingAdmin");
          }}
        />
        <CategoryStat
          title="Approved"
          value={approvedCount}
          subtitle="Admin approved"
          icon={<IconMail />}
          variant="emerald"
          active={roleFilter === "all" && statusFilter === "approved"}
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("approved");
          }}
        />
      </div>

      {/* REJECTED USERS MODAL */}
      {showRejectedModal && (
        <ModalShell zIndex={110} onClose={() => setShowRejectedModal(false)}>
          <div
            style={{
              width: 980,
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                  Rejected Users
                </h3>
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  These accounts are tagged as rejected and are not shown in the
                  main Users table.
                </div>
              </div>

              <button
                className="ad-btn"
                type="button"
                onClick={() => setShowRejectedModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 16 }}>
              <div className="ad-table-card" style={{ marginTop: 0 }}>
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Added By</th>
                      <th>Joined</th>
                      <th className="ad-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedSorted.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={roleClass(u.role)}>
                            {normalizeRole(u.role)}
                          </span>
                          <span style={{ marginLeft: 8 }}>{statusPill(u)}</span>
                        </td>
                        <td>
                          {isParent(u)
                            ? u.addedByStudentName ||
                              u.addedByStudentEmail ||
                              "-"
                            : "-"}
                        </td>
                        <td>{u.joined}</td>
                        <td className="ad-actions">
                          <button
                            className="ad-icon-btn"
                            title="View"
                            type="button"
                            onClick={() => {
                              setViewUser(u);
                              setShowRejectedModal(false);
                            }}
                          >
                            <IconMail size={16} />
                          </button>

                          <button
                            className="ad-icon-btn danger"
                            title="Delete"
                            type="button"
                            onClick={() =>
                              setConfirmDelete({ id: u.id, from: "rejected" })
                            }
                          >
                            <IconTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {rejectedSorted.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: 16,
                            color: "#6b7280",
                            textAlign: "center",
                          }}
                        >
                          No rejected users.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                Deleting here is the same as deleting from the main list: Cloud
                Function-first, Firestore fallback.
              </div>
            </div>

            <div
              className="ad-form-actions"
              style={{
                justifyContent: "flex-end",
                padding: 16,
                borderTop: "1px solid #eef2f7",
              }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setShowRejectedModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ID Image Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => {
            setPreviewImage(null);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setIsPanning(false);
          }}
        >
          <div
            style={{
              width: "min(1100px, 95vw)",
              height: "min(780px, 90vh)",
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,.35)",
              border: "1px solid #e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                height: 56,
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #eef2f7",
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 800, color: "#111827" }}>
                ID Preview
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="ad-btn"
                  type="button"
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(1, Math.round((z - 0.25) * 100) / 100),
                    )
                  }
                >
                  -
                </button>
                <button
                  className="ad-btn"
                  type="button"
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(4, Math.round((z + 0.25) * 100) / 100),
                    )
                  }
                >
                  +
                </button>
                <button
                  className="ad-btn"
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setIsPanning(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                height: "calc(100% - 56px)",
                background: "#0b1220",
                overflow: "hidden",
                cursor: isPanning ? "grabbing" : "grab",
              }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY;
                setZoom((z) => {
                  const next = delta > 0 ? z - 0.15 : z + 0.15;
                  return Math.max(1, Math.min(4, Math.round(next * 100) / 100));
                });
              }}
              onMouseDown={(e) => {
                setIsPanning(true);
                panStartRef.current = { x: e.clientX, y: e.clientY };
              }}
              onMouseMove={(e) => {
                if (!isPanning) return;
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;
                setPan({
                  x: lastPanRef.current.x + dx,
                  y: lastPanRef.current.y + dy,
                });
              }}
              onMouseUp={() => {
                setIsPanning(false);
                lastPanRef.current = pan;
              }}
              onMouseLeave={() => {
                setIsPanning(false);
                lastPanRef.current = pan;
              }}
              onDoubleClick={() => {
                if (zoom > 1) {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  lastPanRef.current = { x: 0, y: 0 };
                } else setZoom(2);
              }}
            >
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  maxWidth: "none",
                  maxHeight: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 12,
                  bottom: 12,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(0,0,0,0.35)",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Wheel = zoom • Drag = pan • Double-click = toggle zoom
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <ModalShell zIndex={90} onClose={() => setViewUser(null)}>
          <div
            style={{
              width: 760,
              maxWidth: "94vw",
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
                  User Details
                </h3>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span className={roleClass(viewUser.role)}>
                    {normalizeRole(viewUser.role)}
                  </span>
                  {statusPill(viewUser)}
                </div>
              </div>

              <button
                className="ad-btn"
                type="button"
                onClick={() => setViewUser(null)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 260px" }}>
                  <div
                    style={{
                      width: 260,
                      height: 260,
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {viewUser.photoURL ? (
                      <img
                        src={viewUser.photoURL}
                        alt="Student ID"
                        onClick={() => {
                          setPreviewImage(viewUser.photoURL);
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                          setIsPanning(false);
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        title="Click to view full size"
                      />
                    ) : (
                      <div style={{ color: "#6b7280", fontWeight: 600 }}>
                        No ID image
                      </div>
                    )}
                  </div>

                  <div
                    style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}
                  >
                    ID photo used for verification.
                  </div>
                </div>

                <div style={{ flex: "1 1 380px", minWidth: 280 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr",
                      rowGap: 10,
                      columnGap: 12,
                      color: "#111827",
                    }}
                  >
                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      Name
                    </div>
                    <div>{viewUser.name || "-"}</div>

                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      Email
                    </div>
                    <div>{viewUser.email || "-"}</div>

                    {isParent(viewUser) ? (
                      <>
                        <div style={{ color: "#6b7280", fontWeight: 700 }}>
                          Added By
                        </div>
                        <div>
                          {viewUser.addedByStudentName || "-"}
                          {viewUser.addedByStudentEmail ? (
                            <span style={{ marginLeft: 8, color: "#6b7280" }}>
                              ({viewUser.addedByStudentEmail})
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : null}

                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      ID Number
                    </div>
                    <div>{viewUser.idNumber || "-"}</div>

                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      Email Verified
                    </div>
                    <div>{viewUser.emailVerified ? "Yes" : "No"}</div>

                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      Admin Approved
                    </div>
                    <div>{viewUser.adminApproved ? "Yes" : "No"}</div>

                    <div style={{ color: "#6b7280", fontWeight: 700 }}>
                      Status
                    </div>
                    <div>{viewUser.status || "-"}</div>
                  </div>

                  {(isStudent(viewUser) || isParent(viewUser)) &&
                    !viewUser.emailVerified && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          color: "#374151",
                        }}
                      >
                        This account has not verified their email yet. Approval
                        is disabled until email is verified.
                      </div>
                    )}

                  {isRejectedUser(viewUser) && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #fee2e2",
                        background: "#fff1f2",
                        color: "#9f1239",
                        fontWeight: 700,
                      }}
                    >
                      This account has been rejected.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="ad-form-actions"
              style={{
                justifyContent: "space-between",
                padding: 16,
                borderTop: "1px solid #eef2f7",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                You can approve or reject only after email verification.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {(isStudent(viewUser) || isParent(viewUser)) && (
                  <>
                    <button
                      className={`ad-btn ad-btn-primary ${canApprove ? "" : "disabled"}`}
                      type="button"
                      onClick={() => approveUser(viewUser)}
                      disabled={!canApprove || isApproving}
                      style={{
                        opacity: canApprove && !isApproving ? 1 : 0.6,
                        cursor:
                          canApprove && !isApproving
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {isApproving
                        ? "Working..."
                        : isStudent(viewUser)
                          ? "Confirm ID & Approve"
                          : "Approve Account"}
                    </button>

                    <button
                      className={`ad-btn ${canReject ? "" : "disabled"}`}
                      type="button"
                      onClick={() => rejectUser(viewUser)}
                      disabled={!canReject || isApproving}
                      style={{
                        opacity: canReject && !isApproving ? 1 : 0.6,
                        cursor:
                          canReject && !isApproving ? "pointer" : "not-allowed",
                        borderColor: "#ef4444",
                        color: "#ef4444",
                      }}
                    >
                      {isApproving ? "Working..." : "Reject"}
                    </button>
                  </>
                )}

                <button
                  className="ad-btn"
                  type="button"
                  onClick={() => setViewUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ModalShell zIndex={95} onClose={() => setConfirmDelete(null)}>
          <div
            style={{
              width: 460,
              maxWidth: "92vw",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
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
              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                Best practice: deploy Cloud Function <b>deleteUserCompletely</b>{" "}
                so the user is removed from Firestore, Firebase Auth (email
                freed), and Storage.
                <br />
                <br />
                <b>Note:</b> If this is a Parent, the system will automatically
                remove it from linked students so their Inbox won’t get stuck
                loading.
              </div>
            </div>

            <div
              className="ad-form-actions"
              style={{ justifyContent: "flex-end", padding: 16, gap: 10 }}
            >
              <button
                className="ad-btn"
                type="button"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                type="button"
                onClick={() => doDelete(confirmDelete.id)}
                style={{
                  borderColor: "#ef4444",
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Search */}
      <SearchBox
        placeholder="Search users"
        value={queryText}
        onChange={setQueryText}
      />

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
            onClick={() => {
              setRoleFilter(role);
              setStatusFilter("all");
            }}
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
              <th>Added By</th>
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
                  <span className={roleClass(u.role)}>
                    {normalizeRole(u.role)}
                  </span>
                  <span style={{ marginLeft: 8 }}>{statusPill(u)}</span>
                </td>
                <td>
                  {isParent(u)
                    ? u.addedByStudentName || u.addedByStudentEmail || "-"
                    : "-"}
                </td>
                <td>{u.joined}</td>
                <td className="ad-actions">
                  <button
                    className="ad-icon-btn"
                    title="View"
                    type="button"
                    onClick={() => setViewUser(u)}
                  >
                    <IconMail size={16} />
                  </button>

                  <button
                    className="ad-icon-btn danger"
                    title="Delete"
                    type="button"
                    onClick={() => setConfirmDelete({ id: u.id, from: "main" })}
                  >
                    <IconTrash size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: 16, color: "#6b7280", textAlign: "center" }}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Users;
