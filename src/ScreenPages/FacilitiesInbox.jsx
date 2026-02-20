// src/components/FacilitiesInbox.jsx
import React, { useEffect, useState } from "react";
import { db } from "../service/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { IconEye, IconCheck, IconTrash, IconSearch } from "../icons";

const FacilitiesInbox = () => {
  const [facilities, setFacilities] = useState([]);
  const [query, setQuery] = useState("");
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "incomingFacilities"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || "—",
            type: d.type || "—",
            image: d.image || null,
            submittedBy: d.submittedBy || "—",
            submittedAt: d.submittedAt || null,
            approved: d.approved || false,
          };
        });
        setFacilities(data);
      },
    );

    return () => unsub();
  }, []);

  const handleApprove = async (id) => {
    const docRef = doc(db, "incomingFacilities", id);
    await updateDoc(docRef, { approved: true, approvedAt: serverTimestamp() });
    setApproveId(null);
  };

  const handleReject = async (id) => {
    await deleteDoc(doc(db, "incomingFacilities", id));
    setRejectId(null);
  };

  const filteredFacilities = facilities.filter((f) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q) ||
      f.submittedBy.toLowerCase().includes(q)
    );
  });

  return (
    <div className="ad-fac">
      <header className="ad-header">
        <h1 className="ad-title">Incoming Facilities</h1>
      </header>

      <div className="ad-search">
        <span className="ad-search-ico" aria-hidden>
          <IconSearch size={16} />
        </span>
        <input
          className="ad-search-input"
          placeholder="Search Facilities"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div
        className="ad-table-card"
        style={{ maxHeight: 500, overflowY: "auto" }}
      >
        <table className="ad-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Facility Name</th>
              <th>Type</th>
              <th>Submitted By</th>
              <th>Submitted At</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  No facilities found
                </td>
              </tr>
            ) : (
              filteredFacilities.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.image ? (
                      <img
                        src={f.image}
                        alt={f.name}
                        className="ad-fac-img"
                        style={{ cursor: "pointer" }}
                        onClick={() => f.image && setViewImage(f.image)}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{f.name}</td>
                  <td>{f.type}</td>
                  <td>{f.submittedBy}</td>
                  <td>
                    {f.submittedAt?.toDate
                      ? f.submittedAt.toDate().toLocaleString()
                      : f.submittedAt?.seconds
                        ? new Date(
                            f.submittedAt.seconds * 1000,
                          ).toLocaleString()
                        : "—"}
                  </td>
                  <td className="ad-actions">
                    <button
                      className="ad-icon-btn"
                      onClick={() => f.image && setViewImage(f.image)}
                      title="View"
                    >
                      <IconEye size={18} />
                    </button>
                    <button
                      className="ad-icon-btn"
                      onClick={() => setApproveId(f.id)}
                      title="Approve"
                    >
                      <IconCheck size={18} />
                    </button>
                    <button
                      className="ad-icon-btn danger"
                      onClick={() => setRejectId(f.id)}
                      title="Reject"
                    >
                      <IconTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {viewImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setViewImage(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              maxWidth: "90%",
              maxHeight: "90%",
              padding: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewImage}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8 }}
            />
            <div className="ad-form-actions" style={{ marginTop: 12 }}>
              <button className="ad-btn" onClick={() => setViewImage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveId && (
        <div className="ad-modal">
          <div className="ad-modal-content">
            <h3>Confirm Approval</h3>
            <div className="ad-form-actions">
              <button className="ad-btn" onClick={() => setApproveId(null)}>
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                onClick={() => handleApprove(approveId)}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="ad-modal">
          <div className="ad-modal-content">
            <h3>Confirm Rejection</h3>
            <div className="ad-form-actions">
              <button className="ad-btn" onClick={() => setRejectId(null)}>
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                onClick={() => handleReject(rejectId)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitiesInbox;
