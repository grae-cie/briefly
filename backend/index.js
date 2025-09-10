import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from "@cyber2024/pdf-parse-fixed";
import mammoth from "mammoth";
import PDFDocument from "pdfkit";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to extract text from different file types
const extractText = async (file, mimetype) => {
  if (mimetype === "application/pdf") {
    const data = await pdf(file.buffer);
    return { text: data.text, pages: data.numpages };
  }
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return {
      text: result.value,
      pages: Math.ceil(result.value.split(/\s+/).length / 350),
    };
  }
  if (mimetype === "text/plain") {
    const text = file.buffer.toString("utf-8");
    return { text, pages: Math.ceil(text.split(/\s+/).length / 350) };
  }
  throw new Error("Unsupported file type");
};

// Retry wrapper for Gemini
const generateWithRetry = async (prompt, retries = 3) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(
          `Attempt ${i + 1} failed with 503, retrying in ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
};

app.post("/summarize", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const extracted = await extractText(req.file, req.file.mimetype);
    let text = extracted.text;
    let pages = extracted.pages;

    if (!text.trim()) {
      return res
        .status(400)
        .json({ error: "Could not extract text from file." });
    }

    // Adjust instruction based on length
    let detailInstruction;
    if (pages <= 3) {
      detailInstruction = "Provide a concise summary (1–2 paragraphs).";
    } else if (pages <= 10) {
      detailInstruction = "Provide a moderately detailed summary (3–5 paragraphs).";
    } else if (pages <= 30) {
      detailInstruction =
        "Provide a comprehensive summary (6–10 paragraphs), covering all main points.";
    } else {
      detailInstruction = `This is a long document (~${pages} pages). Provide a detailed chapter-by-chapter style summary, with all key arguments, findings, and conclusions.`;
    }

    const prompt = `${detailInstruction}\n\nHere is the document:\n\n${text}`;
    const summary = await generateWithRetry(prompt);

    // Generate summary PDF into memory buffer
    const buffers = [];
    const doc = new PDFDocument();
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);

      res.json({
        meta: {
          pages,
          date: new Date().toISOString(),
          summary,
        },
        pdf: pdfBuffer.toString("base64"), // send PDF as base64
      });
    });

    doc.fontSize(16).text("AI Summary", { align: "center" }).moveDown();
    doc.fontSize(12).text(summary, { align: "left" });
    doc.end();
  } catch (err) {
    console.error("Error during summarization:", err);
    res
      .status(500)
      .json({ error: "An error occurred during summarization." });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
