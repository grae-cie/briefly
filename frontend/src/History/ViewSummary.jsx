import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ViewSummary.css";

function ViewSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state?.summary;

  if (!summary) {
    return <p style={{ textAlign: "center", marginTop: "100px" }}>No summary selected.</p>;
  }

  return (
    <div className="view-page">
      <div className="view-header">
        <h2>{summary.fileName}</h2>
        <button onClick={() => navigate(-1)}>← Back</button>
      </div>
        <div className="summary-text">
        <h3>AI Summary</h3>
        <p>{summary.text || summary.summary || "No text available for this summary."}</p>
      </div>

    </div>
  );
}

export default ViewSummary;
