import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

function PdfInfo({ file }) {
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        try {
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          setNumPages(pdf.numPages);
        } catch (err) {
          console.error("Error loading PDF:", err);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  return (
    <div className="pdf-info">
      <p>📄 <strong>{file.name}</strong></p>
      {numPages && <p>Pages: {numPages}</p>}
    </div>
  );
}

export default PdfInfo;
