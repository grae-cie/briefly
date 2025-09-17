import express from "express";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from "@cyber2024/pdf-parse-fixed";
import mammoth from "mammoth";
import PDFDocument from "pdfkit";
import authRoutes from "./routes/authRoutes.js";

dotenv.config(); // load .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://briefly-liart.vercel.app"], 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"], 
}));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Auth routes
app.use("/auth", authRoutes);

// ---------------------
// Multer setup: memory storage
// ---------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------
// Extract text function
// ---------------------
const extractText = async (file, mimetype) => {
  const buffer = file.buffer;

  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return { text: data.text, pages: data.numpages };
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      pages: Math.ceil(result.value.split(/\s+/).length / 350),
    };
  }

  if (mimetype === "text/plain") {
    const text = buffer.toString("utf-8");
    return { text, pages: Math.ceil(text.split(/\s+/).length / 350) };
  }

  throw new Error("Unsupported file type");
};

// ---------------------
// Retry wrapper for AI
// ---------------------
const generateWithRetry = async (prompt, retries = 3) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed with 503, retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
};

// ---------------------
// Summarizer route
// ---------------------
app.post("/summarize", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const extracted = await extractText(req.file, req.file.mimetype);
    const text = extracted.text;
    const pages = extracted.pages;

    if (!text.trim()) {
      return res.status(400).json({ error: "Could not extract text from file." });
    }

    // Decide detail level based on pages
   // Calculate summary length based on pages
const wordCount = text.split(/\s+/).length;
let targetWordCount;

if (pages <= 3) {
  targetWordCount = Math.ceil(wordCount * 0.5); // half the words
} else if (pages <= 10) {
  targetWordCount = Math.ceil(wordCount * 0.4);
} else if (pages <= 30) {
  targetWordCount = Math.ceil(wordCount * 0.35);
} else {
  targetWordCount = Math.ceil(wordCount * 0.3);
}

const prompt = `Summarize the following document in approximately ${targetWordCount} words:\n\n${text}`;
const summary = await generateWithRetry(prompt);

    // Generate PDF
    const buffers = [];
    const doc = new PDFDocument();
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.json({
        meta: { pages, date: new Date().toISOString(), summary },
        pdf: pdfBuffer.toString("base64"),
      });
    });

    doc.fontSize(16).text("AI Summary", { align: "center" }).moveDown();
    doc.fontSize(12).text(summary, { align: "left" });
    doc.end();

  } catch (err) {
    console.error("Error during summarization:", err);
    res.status(500).json({ error: "An error occurred during summarization." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
