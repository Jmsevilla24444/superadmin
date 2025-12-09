import React from "react";
import "../AdminDashboard.css";
import { IconPlus, IconMail, IconLock } from "../icons";
import { auth, db } from "../service/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const Field = ({ label, children }) => (
  <div>
    <div className="ad-label">{label}</div>
    {children}
  </div>
);

const SuperAdminCreateAdmin = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Basic validations
  const isEmailValid = /^\S+@gmail\.com$/i.test(email);

  const onSubmit = async (e) => {
    e.preventDefault();

    // Handle validation messages
    if (!name || !email || !password || !confirm) {
      setError("All fields are required.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid Gmail address.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Create admin user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 2. Generate a token for the admin
      const token = uuidv4();

      // 3. Save admin details in Firestore
      await setDoc(doc(db, "Admin", uid), {
        uid,
        name,
        email,
        token,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      alert(`Admin account created successfully for ${name} (${email}).`);
      window.location.hash = "#/su/users";

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create admin account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Create Admin Account</h2>
      <form className="ad-form ad-add" onSubmit={onSubmit}>
        <div className="ad-form-grid">
          <div className="ad-form-left">
            <Field label="Full Name">
              <input
                className="ad-input"
                type="text"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Email">
              <div style={{ position: "relative" }}>
                <span className="ad-search-ico" aria-hidden>
                  <IconMail size={16} />
                </span>
                <input
                  className="ad-input"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <span className="ad-search-ico" aria-hidden>
                  <IconLock size={16} />
                </span>
                <input
                  className="ad-input"
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>

            <Field label="Confirm Password">
              <div style={{ position: "relative" }}>
                <span className="ad-search-ico" aria-hidden>
                  <IconLock size={16} />
                </span>
                <input
                  className="ad-input"
                  type="password"
                  placeholder="Repeat Password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>

            {/* Error messages */}
            {error && (
              <div style={{ color: "red", marginTop: 8, fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="ad-form-actions">
          <button
            className="ad-btn ad-btn-primary"
            type="submit"
            disabled={submitting} // ✅ only disable while submitting
          >
            <span className="ad-btn-ico">
              <IconPlus size={16} stroke="#fff" />
            </span>
            {submitting ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SuperAdminCreateAdmin;
