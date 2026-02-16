import React, { useEffect, useState } from "react";
import { db } from "../service/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const Approval = () => {
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [modalMessage, setModalMessage] = useState("");

  // ===== MODAL HANDLER =====
  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 2000); // auto hide after 2s
  };

  // ===== REALTIME FETCH =====
  useEffect(() => {
    // Event Requests listener
    const unsubscribeEvents = onSnapshot(
      collection(db, "EventRequests"),
      (snapshot) => {
        const eventList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEvents(eventList);
      },
      (error) => console.error("EVENTS SNAPSHOT ERROR:", error),
    );

    // Notification Requests listener
    const unsubscribeNotifications = onSnapshot(
      collection(db, "NotificationRequests"),
      (snapshot) => {
        const notifList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setNotifications(notifList);
      },
      (error) => console.error("NOTIFICATIONS SNAPSHOT ERROR:", error),
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeNotifications();
    };
  }, []);

  // ===== EVENT HANDLERS =====
  const handleAcceptEvent = async (event) => {
    try {
      const { id, ...eventData } = event;

      await addDoc(collection(db, "Events"), {
        ...eventData,
        createdAt: serverTimestamp(),
      });

      await deleteDoc(doc(db, "EventRequests", id));
      showModal("Event accepted successfully!");
    } catch (err) {
      console.error("ACCEPT EVENT ERROR:", err);
      alert("Failed to accept event.");
    }
  };

  const handleDeclineEvent = async (id) => {
    try {
      await deleteDoc(doc(db, "EventRequests", id));
      showModal("Event declined successfully!");
    } catch (err) {
      console.error("DECLINE EVENT ERROR:", err);
      alert("Failed to decline event.");
    }
  };

  // ===== NOTIFICATION HANDLERS =====
  const handleAcceptNotification = async (notif) => {
    try {
      const { id, ...notifData } = notif;

      await addDoc(collection(db, "Notifications"), {
        ...notifData,
        createdAt: serverTimestamp(),
      });

      await deleteDoc(doc(db, "NotificationRequests", id));
      showModal("Notification accepted successfully!");
    } catch (err) {
      console.error("ACCEPT NOTIFICATION ERROR:", err);
      alert("Failed to accept notification.");
    }
  };

  const handleDeclineNotification = async (id) => {
    try {
      await deleteDoc(doc(db, "NotificationRequests", id));
      showModal("Notification declined successfully!");
    } catch (err) {
      console.error("DECLINE NOTIFICATION ERROR:", err);
      alert("Failed to decline notification.");
    }
  };

  return (
    <div className="ad-add">
      {/* ===== EVENTS TABLE ===== */}
      <header className="ad-header">
        <h1 className="ad-title">Event Approvals</h1>
      </header>

      {events.length === 0 ? (
        <p style={{ padding: 20 }}>No pending event requests.</p>
      ) : (
        <div
          className="ad-table-card"
          style={{ marginTop: 20, maxHeight: 300, overflowY: "auto" }}
        >
          <table className="ad-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Description</th>
                <th className="ad-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.image ? (
                      <img
                        src={e.image}
                        alt={e.title}
                        style={{
                          width: 80,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewImage(e.image)}
                      />
                    ) : (
                      <span>No Image</span>
                    )}
                  </td>
                  <td>{e.title}</td>
                  <td>{e.date}</td>
                  <td>{e.time}</td>
                  <td>{e.description}</td>
                  <td className="ad-actions">
                    <button
                      className="ad-btn ad-btn-primary"
                      onClick={() => handleAcceptEvent(e)}
                    >
                      Accept
                    </button>
                    <button
                      className="ad-btn danger"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleDeclineEvent(e.id)}
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== NOTIFICATIONS TABLE ===== */}
      <header className="ad-header" style={{ marginTop: 40 }}>
        <h1 className="ad-title">Notification Approvals</h1>
      </header>

      {notifications.length === 0 ? (
        <p style={{ padding: 20 }}>No pending notification requests.</p>
      ) : (
        <div
          className="ad-table-card"
          style={{ marginTop: 20, maxHeight: 300, overflowY: "auto" }}
        >
          <table className="ad-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Message</th>
                <th className="ad-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.date}</td>
                  <td>{n.time}</td>
                  <td>{n.message}</td>
                  <td className="ad-actions">
                    <button
                      className="ad-btn ad-btn-primary"
                      onClick={() => handleAcceptNotification(n)}
                    >
                      Accept
                    </button>
                    <button
                      className="ad-btn danger"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleDeclineNotification(n.id)}
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== IMAGE PREVIEW MODAL ===== */}
      {previewImage && (
        <div
          className="ad-modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {modalMessage && (
        <div
          className="ad-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px 40px",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              fontWeight: "bold",
            }}
          >
            {modalMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
