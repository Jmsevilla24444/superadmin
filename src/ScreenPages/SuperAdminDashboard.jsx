import React from "react";
import "../AdminDashboard.css";
import FacilitiesInbox from "./FacilitiesInbox";

import {
  IconHome,
  IconBuilding,
  IconCalendar,
  IconReport,
  IconPlus,
  IconMail,
  IconGlobe,
} from "../icons";

import Users from "./Users";
import Reports from "./Reports";
import SuperAdminCreateAdmin from "./SuperAdminCreateAdmin";
import LogoutMenu from "./LogoutMenu";

import { auth, db } from "../service/firebase";
import { collection, onSnapshot, collectionGroup } from "firebase/firestore";
import Approval from "./approval";
import SuperAdminChatbotFeeder from "./Superadminchatbotfeeder";

/**
 * COLOR SYSTEM (matches your AdminDashboard.css)
 * - indigo: #6366f1
 * - blue/cyan: #2563eb
 * - emerald: #10b981
 * - amber: #f59e0b
 * - rose: #f43f5e
 * - purple: #7c3aed (chips)
 
 */
const COLORS = {
  indigo: "#6366f1",
  blue: "#2563eb",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#94a3b8",
  purple: "#7c3aed",
};

// Placeholder for FacilitiesInbox if not yet implemented


// Sidebar Component
const Sidebar = ({ route, counts }) => {
  const isActive = (r) => (route === r ? "ad-nav-item active" : "ad-nav-item");

  return (
    <aside className="ad-sidebar">
      <div className="ad-brand">
        <div
          className="ad-logo"
          style={{
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 248,
            height: 86,
            borderRadius: 6,
            background: "transparent",
          }}
        >
          <img
            src="/image.png"
            alt="SuperAdmin"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>

      <nav className="ad-nav">
        <a className={isActive("#/su/dashboard")} href="#/su/dashboard">
          <span className="ad-nav-ico">
            <IconHome size={20} stroke="#eaf2ff" />
          </span>
          <span>Dashboard</span>
        </a>

        <a className={isActive("#/su/users")} href="#/su/users">
          <span className="ad-nav-ico">
            <IconCalendar size={20} stroke="#eaf2ff" />
          </span>
          <span>Users</span>

          {/* Badge: show pending admin approvals as attention signal */}
          {counts.pendingAdmin > 0 && (
            <span style={{ marginLeft: "auto" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  background: COLORS.rose,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                }}
                title="Pending admin approval"
              >
                {counts.pendingAdmin}
              </span>
            </span>
          )}
        </a>


        <a className={isActive("#/su/create-admin")} href="#/su/create-admin">
          <span className="ad-nav-ico">
            <IconPlus size={20} stroke="#eaf2ff" />
          </span>
          <span>Create Admin</span>
        </a>

        <a className={isActive("#/su/facilities")} href="#/su/facilities">
          <span className="ad-nav-ico">
            <IconBuilding size={20} stroke="#eaf2ff" />
          </span>
          <span>Facilities</span>
          {counts.facilities > 0 && (
            <span style={{ marginLeft: "auto" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  background: COLORS.emerald,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                }}
              >
                {counts.facilities}
              </span>
            </span>
          )}
        </a>

        <a className={isActive("#/su/approval")} href="#/su/approval">
          <span className="ad-nav-ico">
            <IconReport size={20} stroke="#eaf2ff" />
          </span>
          <span>Approval</span>
        </a>

        <a className={isActive("#/su/reports")} href="#/su/reports">
          <span className="ad-nav-ico">
            <IconReport size={20} stroke="#eaf2ff" />
          </span>
          <span>Reports</span>
          {counts.reports > 0 && (
            <span style={{ marginLeft: "auto" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  background: COLORS.amber,
                  color: "#111827",
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 999,
                  boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                }}
              >
                {counts.reports}
              </span>
            </span>
          )}
        </a>

        <a className={isActive("#/su/chatbot")} href="#/su/chatbot">
          <span className="ad-nav-ico">
            <IconGlobe size={20} stroke="#eaf2ff" />
          </span>
          <span>Chatbot Feeder</span>
        </a>
      </nav>
    </aside>
  );
};

// Header Component
const HeaderBar = ({ title }) => (
  <header className="ad-header">
    <h1 className="ad-title">{title}</h1>
    <LogoutMenu />
  </header>
);

// Stat Card Component
const Stat = ({ title, value, icon, variant = "indigo" }) => (
  <div className="ad-stat">
    <div className={`ad-stat-badge ${variant}`} aria-hidden>
      {icon}
    </div>
    <div className="ad-stat-body">
      <div className="ad-stat-title">{title}</div>
      <div className="ad-stat-value">{value}</div>
    </div>
  </div>
);

// Quick Action Card Component
const QuickAction = ({ title, desc, icon, href, variant = "indigo" }) => (
  <button
    type="button"
    className="ad-qa-item"
    onClick={() => (window.location.hash = href)}
    aria-label={title}
  >
    <div className={`ad-qa-ico ${variant}`} aria-hidden>
      {icon}
    </div>
    <div className="ad-qa-text">
      <div className="ad-qa-title">{title}</div>
      <div className="ad-qa-desc">{desc}</div>
    </div>
  </button>
);

// Donut Chart Component (used for Status only)
const DonutChart = ({
  data,
  colors,
  size = 220,
  hole = 0.62,
  centerText,
  ariaLabel = "Distribution",
}) => {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;

  const stops = data
    .map((v, i) => {
      const start = (acc / total) * 360;
      acc += v;
      const end = (acc / total) * 360;
      const color = colors[i % colors.length];
      return `${color} ${start}deg ${end}deg`;
    })
    .join(",");

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(${stops})`,
        position: "relative",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
      aria-label={ariaLabel}
    >
      <div
        style={{
          position: "absolute",
          inset: (size * (1 - hole)) / 2,
          width: size * hole,
          height: size * hole,
          background: "#fff",
          borderRadius: "50%",
        }}
        aria-hidden
      />
      {centerText && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            lineHeight: 1.1,
            color: "#111827",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {centerText.title}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {centerText.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};

const RowLegend = ({ label, color, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span
      style={{
        width: 12,
        height: 12,
        background: color,
        borderRadius: 3,
      }}
    />
    <span style={{ color: "#111827", fontWeight: 600 }}>{label}</span>
    <span style={{ color: "#6b7280" }}>({value})</span>
  </div>
);

// Role distribution (Horizontal Bars)
const RoleBars = ({ total, items }) => {
  const safeTotal = Math.max(1, Number(total) || 0);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it) => {
        const pct = Math.round((it.value / safeTotal) * 100);
        const width = Math.min(
          100,
          Math.max(0, (Number(it.value || 0) / safeTotal) * 100),
        );

        return (
          <div key={it.label} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, color: "#111827" }}>
                {it.label}
              </div>
              <div style={{ color: "#6b7280", fontWeight: 700 }}>
                {it.value} <span style={{ fontWeight: 600 }}>({pct}%)</span>
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "#eef2f7",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${width}%`,
                  background: it.color,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// SuperAdminDashboard Component
const SuperAdminDashboard = () => {
  const [route, setRoute] = React.useState(
    window.location.hash || "#/su/dashboard",
  );
  const [authenticated, setAuthenticated] = React.useState(false);

  const [counts, setCounts] = React.useState({
    // total USERS should be only from "users" collection
    users: 0,

    // admins separately (does not affect total users)
    admins: 0,

    // role analytics (users collection)
    students: 0,
    parents: 0,
    others: 0,

    // status analytics (users collection)
    pendingEmail: 0,
    pendingAdmin: 0,
    approved: 0,
    rejected: 0,

    // other collections
    facilities: 0,
    reports: 0,
  });

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) setAuthenticated(true);
      else {
        setAuthenticated(false);
        window.location.hash = "#/su/login";
      }
    });

    const onHashChange = () =>
      setRoute(window.location.hash || "#/su/dashboard");
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = "#/su/dashboard";

    // --- Realtime: USERS collection (roles + statuses)
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      let students = 0;
      let parents = 0;
      let others = 0;

      let pendingEmail = 0;
      let pendingAdmin = 0;
      let approved = 0;
      let rejected = 0;

      snap.forEach((d) => {
        const data = d.data() || {};
        const role = String(data.role || "")
          .toLowerCase()
          .trim();
        const status = String(data.status || "")
          .toLowerCase()
          .trim();

        const emailVerified = data.emailVerified === true;
        const adminApproved = data.adminApproved === true;

        // roles
        if (role === "student") students += 1;
        else if (role === "parents" || role === "parent") parents += 1;
        else others += 1;

        // status buckets
        if (status === "rejected") {
          rejected += 1;
          return;
        }

        if (!emailVerified) {
          pendingEmail += 1;
          return;
        }

        if (!adminApproved || status === "pending_admin") {
          pendingAdmin += 1;
          return;
        }

        approved += 1;
      });

      setCounts((prev) => ({
        ...prev,
        users: snap.size,
        students,
        parents,
        others,
        pendingEmail,
        pendingAdmin,
        approved,
        rejected,
      }));
    });

    // --- Realtime: Admin collection (separate)
    const unsubAdmins = onSnapshot(collection(db, "Admin"), (snap) =>
      setCounts((prev) => ({ ...prev, admins: snap.size })),
    );

    // --- Realtime: Facilities inbox
   const unsubFacilities = onSnapshot(
  collection(db, "incomingFacilities"),
  (snap) => setCounts((prev) => ({ ...prev, facilities: snap.size })),
);


    // --- Realtime: Reports (collectionGroup)
    const unsubReports = onSnapshot(collectionGroup(db, "reports"), (snap) =>
      setCounts((prev) => ({ ...prev, reports: snap.size })),
    );

    return () => {
      unsubscribeAuth();
      window.removeEventListener("hashchange", onHashChange);
      unsubUsers();
      unsubAdmins();
      unsubFacilities();
      unsubReports();
    };
  }, []);

  if (!authenticated) return null;

  const renderContent = () => {
    switch (route) {
      case "#/su/users":
        return (
          <>
            <HeaderBar title="Users" />
            <Users />
          </>
        );

      case "#/su/create-admin":
        return (
          <>
            <HeaderBar title="Create Admin" />
            <SuperAdminCreateAdmin />
          </>
        );

      case "#/su/facilities":
        return (
          <>
            <HeaderBar title="Facilities Inbox" />
            <FacilitiesInbox />
          </>
        );

      case "#/su/approval":
        return (
          <>
            <HeaderBar title="Approval" />
            <Approval />
          </>
        );

      case "#/su/reports":
        return (
          <>
            <HeaderBar title="Reports" />
            <Reports />
          </>
        );

      case "#/su/chatbot":
        return (
          <>
            <HeaderBar title="Chatbot Knowledge Base" />
            <SuperAdminChatbotFeeder />
          </>
        );

      default: {
        const statusTotal =
          counts.approved +
          counts.pendingAdmin +
          counts.pendingEmail +
          counts.rejected;

        // Graph palette (consistent everywhere)
        const STATUS_COLORS = [
          COLORS.emerald, // Approved
          COLORS.amber, // Pending Admin
          COLORS.blue, // Pending Email
          COLORS.rose, // Rejected
        ];

        return (
          <>
            <HeaderBar title="SuperAdmin Dashboard" />

            {/* MAIN STATS */}
            <section className="ad-stats">
              <Stat
                title="Total Users"
                value={counts.users}
                icon={<IconCalendar />}
                variant="indigo"
              />
              <Stat
                title="Pending Admin Approval"
                value={counts.pendingAdmin}
                icon={<IconMail />}
                variant="amber"
              />
              <Stat
                title="Pending Email Verification"
                value={counts.pendingEmail}
                icon={<IconMail />}
                variant="blue"
              />
              <Stat
                title="Approved Users"
                value={counts.approved}
                icon={<IconCalendar />}
                variant="emerald"
              />
              <Stat
                title="Rejected Users"
                value={counts.rejected}
                icon={<IconReport />}
                variant="rose"
              />
              <Stat
                title="Facilities Inbox"
                value={counts.facilities}
                icon={<IconBuilding />}
                variant="emerald"
              />
              <Stat
                title="Reports"
                value={counts.reports}
                icon={<IconReport />}
                variant="amber"
              />
            </section>

            {/* Quick Actions */}
            <section className="ad-section">
              <h2 className="ad-section-title">Quick Actions</h2>
              <div className="ad-qa-grid">
                <QuickAction
                  title="Manage Users"
                  desc="View and manage user accounts"
                  icon={<IconCalendar stroke="#fff" />}
                  href="#/su/users"
                  variant="indigo"
                />
                <QuickAction
                  title="Approval"
                  desc="Events and Facilities Approvals"
                  icon={<IconReport stroke="#fff" />}
                  href="#/su/approval"
                  variant="amber"
                />
                <QuickAction
                  title="Facilities Inbox"
                  desc="Review facilities submitted by admins"
                  icon={<IconBuilding stroke="#fff" />}
                  href="#/su/facilities"
                  variant="emerald"
                />
                <QuickAction
                  title="View Reports"
                  desc="Handle admin reports"
                  icon={<IconReport stroke="#fff" />}
                  href="#/su/reports"
                  variant="amber"
                />
                <QuickAction
                  title="Create Admin"
                  desc="Add a new admin account"
                  icon={<IconPlus stroke="#fff" />}
                  href="#/su/create-admin"
                  variant="violet"
                />
                <QuickAction
                  title="Chatbot Feeder"
                  desc="Manage chatbot knowledge base"
                  icon={<IconGlobe stroke="#fff" />}
                  href="#/su/chatbot"
                  variant="indigo"
                />
              </div>
            </section>

            {/* Analytics */}
            <section className="ad-section">
              <h2 className="ad-section-title">Analytics</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {/* Status distribution (Donut) */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 4px 12px rgba(0,0,0,.04)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: 10,
                    }}
                  >
                    User Status Distribution
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(220px, 260px) 1fr",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <DonutChart
                      data={[
                        counts.approved,
                        counts.pendingAdmin,
                        counts.pendingEmail,
                        counts.rejected,
                      ]}
                      colors={STATUS_COLORS}
                      size={220}
                      centerText={{
                        title: `${statusTotal || 0}`,
                        subtitle: "Total Users",
                      }}
                      ariaLabel="User status distribution"
                    />

                    <div style={{ display: "grid", gap: 8 }}>
                      <RowLegend
                        label="Approved"
                        color={COLORS.emerald}
                        value={counts.approved}
                      />
                      <RowLegend
                        label="Pending Admin"
                        color={COLORS.amber}
                        value={counts.pendingAdmin}
                      />
                      <RowLegend
                        label="Pending Email"
                        color={COLORS.blue}
                        value={counts.pendingEmail}
                      />
                      <RowLegend
                        label="Rejected"
                        color={COLORS.rose}
                        value={counts.rejected}
                      />
                    </div>
                  </div>
                </div>

                {/* Role distribution (Horizontal Bars) */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 4px 12px rgba(0,0,0,.04)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: 10,
                    }}
                  >
                    User Role Distribution
                  </div>

                  <RoleBars
                    total={counts.users}
                    items={[
                      {
                        label: "Students",
                        value: counts.students,
                        color: COLORS.indigo,
                      },
                      {
                        label: "Parents",
                        value: counts.parents,
                        color: COLORS.emerald,
                      },
                      {
                        label: "Other",
                        value: counts.others,
                        color: COLORS.slate,
                      },
                    ]}
                  />

                  <div
                    style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}
                  >
                    Admins are counted separately: <b>{counts.admins}</b>
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      }
    }
  };

  return (
    <div className="ad-layout">
      <Sidebar route={route} counts={counts} />
      <main className="ad-main">{renderContent()}</main>
    </div>
  );
};

export default SuperAdminDashboard;