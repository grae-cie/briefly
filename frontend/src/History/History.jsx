import React, { useState, useEffect } from "react";
import "./history.css";
import NavbarHistory from "../NavBar/NavBarHistory";
import { MdDelete } from "react-icons/md";

function History({ user, onLogout }) {
  const [summaries, setSummaries] = useState([]);

  // Normalize username whether user is a string or an object
  const username = typeof user === "string" ? user : user?.username || "";

  /**
   * Load saved summaries for the current user
   */
  useEffect(() => {
    if (!username) return;

    const userKey = `summaries_${username}`;
    const saved = JSON.parse(localStorage.getItem(userKey) || "[]");
    setSummaries(saved);
  }, [username]);

  /**
   * Delete a single summary by index
   */
  const handleDelete = (idx) => {
    if (!username) return;

    const userKey = `summaries_${username}`;
    const updated = summaries.filter((_, i) => i !== idx);

    setSummaries(updated);
    localStorage.setItem(userKey, JSON.stringify(updated));

    // Free up memory for the deleted object URL
    try {
      const toRevoke = summaries[idx]?.url;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    } catch (err) {
      console.warn("Failed to revoke object URL:", err);
    }
  };

  return (
    <div className="history-container">
      <NavbarHistory user={user} onLogout={onLogout} />

      <div className="mini-history">
        {summaries.length === 0 ? (
          <p className="no-summary">No summaries yet.</p>
        ) : (
          summaries.map((summary, idx) => (
            <div key={idx} className="summary-box">
              {/* Show filename and meta info */}
              <h3>{summary.fileName}</h3>
              <p>Pages: {summary.pages}</p>
              <p>Created: {summary.date}</p>

              <div className="delete-container">
                {/* Download PDF */}
                <a href={summary.url} download={`summary-${idx + 1}.pdf`}>
                  Download PDF
                </a>

                {/* Delete button */}
                <MdDelete
                  color="white"
                  size={24}
                  onClick={() => handleDelete(idx)}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                  title="Delete this summary"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default History;
