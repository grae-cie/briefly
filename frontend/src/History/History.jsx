import React, { useState, useEffect } from "react";
import "./history.css";
import NavbarHistory from "../NavBar/NavBarHistory";
import { MdDelete } from "react-icons/md";
import { useNavigate } from "react-router-dom";

function History({ user, onLogout }) {
  const [summaries, setSummaries] = useState([]);
  const navigate = useNavigate();

  const username = typeof user === "string" ? user : user?.username || "";

  useEffect(() => {
    if (!username) return;
    const userKey = `summaries_${username}`;
    const savedSummaries = JSON.parse(localStorage.getItem(userKey) || "[]");
    setSummaries(savedSummaries);
  }, [username]);

  // 🟢 View summary → navigate to /view
  const handleView = (summary) => {
    navigate("/view", { state: { summary } });
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

      <div className="mini-history">
        {summaries.length === 0 ? (
          <p className="no-summary">No summaries yet.</p>
        ) : (
          summaries.map((summary, index) => (
            <div key={index} className="summary-box">
              <h3>{summary.fileName}</h3>
              <p>Created: {summary.date}</p>

              <div className="delete-container">
                <button className="view-btn" onClick={() => handleView(summary)}>
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
    </div>
  );
}

export default History;
