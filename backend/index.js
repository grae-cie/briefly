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
import fs from "fs/promises";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://briefly-liart.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Auth routes
app.use("/auth", authRoutes);

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });

// Extract text helper
const extractText = async (file) => {
  const buffer = file.buffer;
  const mimetype = file.mimetype;

  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return { text: data.text, pages: data.numpages };
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    await fs.mkdir("./temp", { recursive: true });
    const tempPath = path.join("./temp", `${Date.now()}-${file.originalname}`);
    await fs.writeFile(tempPath, buffer);

    const result = await mammoth.extractRawText({ path: tempPath });
    await fs.unlink(tempPath);

    return { text: result.value, pages: Math.ceil(result.value.split(/\s+/).length / 350) };
  }

  if (mimetype === "text/plain") {
    const text = buffer.toString("utf-8");
    return { text, pages: Math.ceil(text.split(/\s+/).length / 350) };
  }

  throw new Error("Unsupported file type");
};

// Summarize route
app.post("/summarize", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  try {
    const { text, pages } = await extractText(req.file);
    if (!text.trim()) return res.status(400).json({ error: "Could not extract text." });

    const wordCount = text.split(/\s+/).length;
    let targetWordCount =
      pages <= 3
        ? Math.ceil(wordCount * 0.7)
        : pages <= 10
        ? Math.ceil(wordCount * 0.6)
        : pages <= 30
        ? Math.ceil(wordCount * 0.5)
        : Math.ceil(wordCount * 0.4);

    const prompt = `Summarize the following document in approximately ${targetWordCount} words, keeping all important details:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

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

    doc.fontSize(16).text("Summary", { align: "center" }).moveDown();
    doc.fontSize(12).text(summary, { align: "left" });
    doc.end();
  } catch (err) {
    console.error("Summarization error:", err);
    res.status(500).json({ error: "Server busy! please try again later" });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
