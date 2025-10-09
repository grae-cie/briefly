import React, { useState, useEffect } from "react";
import "./history.css";
import NavbarHistory from "../NavBar/NavBarHistory";
import { MdDelete } from "react-icons/md";

function History({ user, onLogout }) {
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null); // 👈 for viewing mode

  const username = typeof user === "string" ? user : user?.username || "";

  useEffect(() => {
    if (!username) return;
    const userKey = `summaries_${username}`;
    const savedSummaries = JSON.parse(localStorage.getItem(userKey) || "[]");
    setSummaries(savedSummaries);
  }, [username]);

  // 🟢 View summary (open inside same page)
  const viewSummary = (summary) => {
    setSelectedSummary(summary); // show selected summary
  };

  // 🔴 Go back to list
  const goBack = () => {
    setSelectedSummary(null);
  };

  // 🔴 Delete summary
  const handleDelete = (index) => {
    if (!username) return;
    const userKey = `summaries_${username}`;
    const updatedSummaries = summaries.filter((_, i) => i !== index);
    setSummaries(updatedSummaries);
    localStorage.setItem(userKey, JSON.stringify(updatedSummaries));
    try {
      const toRevoke = summaries[index]?.url;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    } catch (err) {
      console.warn("Failed to revoke object URL:", err);
    }
  };

  return (
    <div className="history-container">
      <NavbarHistory user={user} onLogout={onLogout} />

      {/* 👇 Conditional Rendering */}
      {!selectedSummary ? (
        // === LIST VIEW ===
        <div className="mini-history">
          {summaries.length === 0 ? (
            <p className="no-summary">No summaries yet.</p>
          ) : (
            summaries.map((summary, index) => (
              <div key={index} className="summary-box">
                <h3>{summary.fileName}</h3>
                <p>Created: {summary.date}</p>

                <div className="delete-container">
                  <button
                    onClick={() => viewSummary(summary)}
                    className="view-btn"
                  >
                    View
                  </button>

                  <a
                    href={summary.url}
                    download={`summary-${index + 1}.pdf`}
                    className="download-btn"
                  >
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
      ) : (
        // === VIEWER MODE ===
        <div className="pdf-viewer-container">
          <button onClick={goBack} className="back-btn">
            ← Back to History
          </button>
          <h2>{selectedSummary.fileName}</h2>
          <iframe
            src={selectedSummary.url}
            title="PDF Viewer"
            className="pdf-frame"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default History;
