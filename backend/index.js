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
app.use(
  cors({
    origin: ["https://briefly-liart.vercel.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
// Known working models supporting generateContent
// ---------------------
const availableModels = [
  "models/gemini-2.5-pro"
];

// ---------------------
// Extract text function
// ---------------------
const extractText = async (file, mimetype) => {
  const buffer = file.buffer;

  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return { text: data.text, pages: data.numpages };
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
     const arrayBuffer = buffer.buffer.slice(
     buffer.byteOffset,
     buffer.byteOffset + buffer.byteLength
  );

    const result = await mammoth.extractRawText({ arrayBuffer});
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
// Auto-select compatible model
// ---------------------
let cachedModel = null;

const getCompatibleModel = async () => {
  if (cachedModel) return cachedModel;

  for (const modelId of availableModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      // test if model is working
      await model.generateContent("Test prompt");
      console.log(`Using model: ${modelId}`);
      cachedModel = model;
      return model;
    } catch (err) {
      console.warn(`Model ${modelId} not compatible: ${err.message}`);
    }
  }

  throw new Error("No compatible model found.");
};

// ---------------------
// Generate summary with retry for 503 errors
// ---------------------
const generateSummaryWithRetry = async (prompt, retries = 3) => {
  let delay = 1000; // start 1s
  for (let i = 0; i < retries; i++) {
    try {
      const model = await getCompatibleModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed with 503. Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
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

    // Decide summary length based on pages (longer summaries)
    const wordCount = text.split(/\s+/).length;
    let targetWordCount;

    if (pages <= 3) {
      targetWordCount = Math.ceil(wordCount * 0.7);
    } else if (pages <= 10) {
      targetWordCount = Math.ceil(wordCount * 0.6);
    } else if (pages <= 30) {
      targetWordCount = Math.ceil(wordCount * 0.5);
    } else {
      targetWordCount = Math.ceil(wordCount * 0.4);
    }

    const prompt = `Summarize the following document in approximately ${targetWordCount} words, keeping all important details and explanations. Provide a clear, thorough, and detailed summary:\n\n${text}`;

    // Generate summary with retry
    const summary = await generateSummaryWithRetry(prompt);

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
