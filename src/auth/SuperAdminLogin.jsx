import React, { useState, useEffect } from "react";
import "./SuperAdminLogin.css";
import { auth, db } from "../service/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Auto-check if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is SuperAdmin
        const docRef = doc(db, "SuperAdmin", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === "SuperAdmin") {
          // Redirect to dashboard
          window.location.hash = "#/su/dashboard";
        } else {
          await auth.signOut();
          localStorage.removeItem("superAdminUID");
          sessionStorage.removeItem("superAdminUID");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if user exists in SuperAdmin collection
      const docRef = doc(db, "SuperAdmin", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().role !== "SuperAdmin") {
        setError("You do not have SuperAdmin privileges.");
        await auth.signOut();
        return;
      }

      // Remember me
      if (remember) {
        localStorage.setItem("superAdminUID", user.uid);
      } else {
        sessionStorage.setItem("superAdminUID", user.uid);
      }

      // Redirect to dashboard
      window.location.hash = "#/su/dashboard";
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/user-not-found":
          setError("No SuperAdmin found with this email.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="superadmin-login-page">
      <div className="superadmin-card">
        <h1 className="superadmin-title">SuperAdmin Login</h1>
        <form onSubmit={onSubmit} className="superadmin-form" autoComplete="on">
          {error && <p className="superadmin-error">{error}</p>}

          <label className="superadmin-label" htmlFor="email">
            Email
          </label>
          <div className="superadmin-input-wrap">
            <span className="superadmin-input-icon" aria-hidden>
              ✉️
            </span>
            <input
              id="email"
              type="email"
              className="superadmin-input"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="superadmin-label" htmlFor="password">
            Password
          </label>
          <div className="superadmin-input-wrap">
            <span className="superadmin-input-icon" aria-hidden>
              🔒
            </span>
            <input
              id="password"
              type="password"
              className="superadmin-input"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="superadmin-remember">
            <label className="superadmin-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="superadmin-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
