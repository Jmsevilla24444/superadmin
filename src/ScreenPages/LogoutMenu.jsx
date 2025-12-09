import React from "react";
import { auth } from "../service/firebase"; // make sure path is correct

const LogoutMenu = () => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("superAdminUID");
    sessionStorage.removeItem("superAdminUID");
    window.location.hash = "#/su/login";
  };

  return (
    <div className="ad-profile-wrap" ref={ref}>
      <span className="ad-profile">
        Hi, SuperAdmin
        <button
          className="ad-avatar"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        />
      </span>

      {open && (
        <div className="ad-menu">
          <button
            className="ad-menu-item danger"
            type="button"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default LogoutMenu;
