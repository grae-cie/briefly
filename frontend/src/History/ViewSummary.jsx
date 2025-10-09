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

      <iframe
        src={summary.url}
        title="PDF Viewer"
        className="view-pdf-frame"
      ></iframe>
    </div>
  );
}

export default ViewSummary;
