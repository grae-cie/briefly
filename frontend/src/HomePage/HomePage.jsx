import React, { useRef, useState } from "react";
import "./homepage.css";
import Navbar from "../NavBar/NavBar";

function HomePage({ user, onLogout }) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");

  // Handle file input change
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
  };

  //Upload file to backend and save summary to localStorage

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first!");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("https://briefly-rkeu.onrender.com", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.meta && data.pdf) {
        // Convert base64 PDF string → Blob → URL
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0))],
          { type: "application/pdf" }
        );
        const url = URL.createObjectURL(pdfBlob);

        // Build summary object
        const newSummary = {
          fileName: selectedFile.name,
          date: new Date(data.meta.date).toLocaleString(),
          pages: data.meta.pages,
          summary: data.meta.summary,
          url,
        };

        // Generate a unique storage key per user
        const username = typeof user === "string" ? user : user?.username;
        const userKey = `summaries_${username}`;

        // Load old summaries and append new one
        const history = JSON.parse(localStorage.getItem(userKey) || "[]");
        localStorage.setItem(userKey, JSON.stringify([...history, newSummary]));
      } else {
        setError("Failed to generate summary.");
      }
    } catch (err) {
      console.error("Error summarizing:", err);
      setError("Something went wrong while summarizing the file.");
    } finally {
      setLoading(false);

      // Reset input & state
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
    }
  };

  return (
    <div className="homepage-container">
      <Navbar onLogout={onLogout} />

      <div className="main-container">
        {/* Greet the logged-in user */}
        <h1>
          Welcome{" "}
          {typeof user === "string" ? user : user?.username || user?.email}
        </h1>

        <h2>Start a New Summary</h2>

        {/* Upload section */}
        <div className="upload">
          {/* File input */}
          <div className="file-upload">
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload" className="custom-upload-btn">
              {selectedFile ? selectedFile.name : "Choose File"}
            </label>
          </div>

          {/* Summary length selector */}
          <div className="length-selector">
            <label htmlFor="length">Summary Length: </label>
            <select
              id="length"
              value={summaryLength}
              onChange={(e) => setSummaryLength(e.target.value)}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          {/* Upload button */}
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Summarizing..." : "Upload & Summarize"}
          </button>
        </div>

        {/* Error message */}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default HomePage;
