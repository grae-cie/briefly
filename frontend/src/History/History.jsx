import React, { useState, useEffect } from "react";
import "./history.css";
import NavbarHistory from "../NavBar/NavBarHistory";
import { MdDelete } from "react-icons/md";

function History({ user, onLogout }) {
  const [summaries, setSummaries] = useState([]);

  // Ensure we extract a valid username (string or object with `username` field)
  const username = typeof user === "string" ? user : user?.username || "";

  useEffect(() => {
    if (!username) return;

    const userKey = `summaries_${username}`;
    const savedSummaries = JSON.parse(localStorage.getItem(userKey) || "[]");
    setSummaries(savedSummaries);
  }, [username]);

//  function to handle delete
  const handleDelete = (index) => {
    if (!username) return;

    const userKey = `summaries_${username}`;

    // Filter out the deleted summary
    const updatedSummaries = summaries.filter((_, i) => i !== index);

    // Update state & localStorage
    setSummaries(updatedSummaries);
    localStorage.setItem(userKey, JSON.stringify(updatedSummaries));

    // Revoke the object URL if it exists
    try {
      const toRevoke = summaries[index]?.url;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    } catch (err) {
      console.warn("Failed to revoke object URL:", err);
    }
  };

  return (
    <div className="history-container">
      {/* Navbar with logout support */}
      <NavbarHistory user={user} onLogout={onLogout} />
    
      <div className="mini-history">
        {summaries.length === 0 ? (
          <p className="no-summary">No summaries yet.</p>
        ) : (
          summaries.map((summary, index) => (
            <div key={index} className="summary-box">
              {/* Summary details */}
              <h3>{summary.fileName}</h3>
              <p>Pages: {summary.pages}</p>
              <p>Created: {summary.date}</p>

              {/* Actions: Download + Delete */}
              <div className="delete-container">
                <a href={summary.url} download={`summary-${index + 1}.pdf`}>
                  Download PDF
                </a>

                <MdDelete
                  color="white"
                  size={24}
                  onClick={() => handleDelete(index)}
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
