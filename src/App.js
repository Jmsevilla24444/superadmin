import React from "react";
import SuperAdminDashboard from "./ScreenPages/SuperAdminDashboard";
import SuperAdminLogin from "./auth/SuperAdminLogin";

function App() {
  const [route, setRoute] = React.useState(
    window.location.hash || "#/su/login"
  );

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/su/login");
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = "#/su/login"; // fixed typo
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "#/su/login") return <SuperAdminLogin />;
  return <SuperAdminDashboard />;
}

export default App;
