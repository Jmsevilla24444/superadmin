import React from "react";
import "../AdminDashboard.css";

import {
  IconHome,
  IconBuilding,
  IconCalendar,
  IconReport,
  IconPlus,
  IconMail,
} from "../icons";

import Users from "./Users";
import FacilitiesInbox from "../FacilitiesInbox";
import Reports from "./Reports";
import SuperAdminCreateAdmin from "./SuperAdminCreateAdmin";
import SuperAdminEnrollees from "./SuperAdminEnrollees";

import { auth, db } from "../service/firebase";
import LogoutMenu from "./LogoutMenu";

import { collection, onSnapshot } from "firebase/firestore";

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
        </a>

        <a className={isActive("#/su/enrollees")} href="#/su/enrollees">
          <span className="ad-nav-ico">
            <IconMail size={20} stroke="#eaf2ff" />
          </span>
          <span>Enrollees</span>
          {counts.enrollees > 0 && (
            <span style={{ marginLeft: "auto" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                }}
              >
                {counts.enrollees}
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
                  background: "#10b981",
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
                  background: "#f59e0b",
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
      </nav>
    </aside>
  );
};

const HeaderBar = ({ title }) => (
  <header className="ad-header">
    <h1 className="ad-title">{title}</h1>
    <LogoutMenu />
  </header>
);

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

const DonutChart = ({ data, colors, size = 220, hole = 0.62, centerText }) => {
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
      aria-label="Overview distribution"
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

const SuperAdminDashboard = () => {
  const [route, setRoute] = React.useState(
    window.location.hash || "#/su/dashboard"
  );
  const [authenticated, setAuthenticated] = React.useState(false);
  const [counts, setCounts] = React.useState({
    users: 0,
    enrollees: 0,
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

    // Firestore realtime counts
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) =>
      setCounts((prev) => ({ ...prev, users: snap.size }))
    );

    const unsubAdmins = onSnapshot(collection(db, "Admin"), (snap) =>
      setCounts((prev) => ({ ...prev, users: prev.users + snap.size }))
    );

    const unsubEnrollees = onSnapshot(collection(db, "Schedules"), (snap) =>
      setCounts((prev) => ({ ...prev, enrollees: snap.size }))
    );

    const unsubFacilities = onSnapshot(
      collection(db, "FacilitiesInbox"),
      (snap) => setCounts((prev) => ({ ...prev, facilities: snap.size }))
    );

    const unsubReports = onSnapshot(collection(db, "Reports"), (snap) =>
      setCounts((prev) => ({ ...prev, reports: snap.size }))
    );

    return () => {
      unsubscribeAuth();
      window.removeEventListener("hashchange", onHashChange);
      unsubUsers();
      unsubAdmins();
      unsubEnrollees();
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

      case "#/su/enrollees":
        return (
          <>
            <HeaderBar title="New Enrollees" />
            <SuperAdminEnrollees />
          </>
        );

      case "#/su/facilities":
        return (
          <>
            <HeaderBar title="Facilities Inbox" />
            <FacilitiesInbox />
          </>
        );

      case "#/su/reports":
        return (
          <>
            <HeaderBar title="Reports" />
            <Reports />
          </>
        );

      default:
        return (
          <>
            <HeaderBar title="SuperAdmin Dashboard" />

            <section className="ad-stats">
              <Stat
                title="Users"
                value={counts.users}
                icon={<IconCalendar />}
                variant="indigo"
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
              </div>
            </section>

            <section className="ad-section">
              <h2 className="ad-section-title">Overview</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 260px) 1fr",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <DonutChart
                  data={[counts.users, counts.facilities, counts.reports]}
                  colors={["#6366f1", "#10b981", "#f59e0b"]}
                  size={220}
                  centerText={{
                    title: `${
                      counts.users + counts.facilities + counts.reports
                    }`,
                    subtitle: "Total Items",
                  }}
                />

                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: "#6366f1",
                        borderRadius: 3,
                      }}
                    />
                    <span style={{ color: "#111827", fontWeight: 600 }}>
                      Users
                    </span>
                    <span style={{ color: "#6b7280" }}>({counts.users})</span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: "#10b981",
                        borderRadius: 3,
                      }}
                    />
                    <span style={{ color: "#111827", fontWeight: 600 }}>
                      Facilities Inbox
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      ({counts.facilities})
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: "#f59e0b",
                        borderRadius: 3,
                      }}
                    />
                    <span style={{ color: "#111827", fontWeight: 600 }}>
                      Reports
                    </span>
                    <span style={{ color: "#6b7280" }}>({counts.reports})</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        );
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
