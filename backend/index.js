import express from "express"; 
import multer from "multer"; //To recieve files 
import cors from "cors"; // 
import bodyParser from "body-parser"; 
import dotenv from "dotenv";//Read secret keys from .env 
import Groq from "groq-sdk";//The API 
import pdf from "@cyber2024/pdf-parse-fixed";//Read PDF 
import mammoth from "mammoth";//Convert Word (.docx) to text 
import PDFDocument from "pdfkit";//Converts to PDF 
import authRoutes from "./routes/authRoutes.js";//For routes 
import fs from "fs/promises";//File system helper 
import path from "path"; 

dotenv.config();//Read API key 

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

app.use(bodyParser.json({ limit: "50mb" }));//parse incoming jsons and form data 
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); 

// Auth routes 
app.use("/auth", authRoutes); 

// Multer setup 
const upload = multer({ storage: multer.memoryStorage() }); 

// Google AI 
const client = new Groq({ apiKey: process.env.GROQ_API_KEY }); 

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

app.post("/summarize", upload.single("file"), async (req, res) => { 
  console.log("Received file:", req.file?.originalname); 

  if (!req.file) return res.status(400).json({ error: "No file uploaded." }); 

  try { 
    const { text, pages } = await extractText(req.file); 

    if (!text.trim()) return res.status(400).json({ error: "Could not extract text." }); 

    // Split text into chunks to avoid API token limits 
    const words = text.split(/\s+/); 
    const CHUNK_SIZE = 3000; // approx. number of words per chunk (adjust if needed) 
    const chunks = []; 
    for (let i = 0; i < words.length; i += CHUNK_SIZE) { 
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" ")); 
    } 

    console.log(`Total chunks to summarize: ${chunks.length}`); 

    // Summarize each chunk separately 
    const chunkSummaries = []; 
    for (let i = 0; i < chunks.length; i++) { 
      const prompt = `Summarize this section of a document, keeping all important details:\n\n${chunks[i]}`; 
      const result = await client.chat.completions.create({ 
        model: "llama-3.3-70b-versatile", 
        messages: [{ role: "user", content: prompt }], 
        max_tokens: 3000, 
      }); 
      const summary = result.choices[0].message.content; 
      console.log(`Chunk ${i + 1} summarized`); 
      chunkSummaries.push(summary); 
    } 

    // Combine all chunk summaries into a final summary 
    const finalSummary = chunkSummaries.join("\n\n"); 

    // Convert to PDF 
    const buffers = []; 
    const doc = new PDFDocument(); 
    doc.on("data", (chunk) => buffers.push(chunk)); 
    doc.on("end", () => { 
      const pdfBuffer = Buffer.concat(buffers); 
      res.json({ 
        meta: { pages, date: new Date().toISOString(), summary: finalSummary }, 
        pdf: pdfBuffer.toString("base64"), 
      }); 
    }); 

    doc.fontSize(16).text("Summary", { align: "center" }).moveDown(); 
    doc.fontSize(12).text(finalSummary, { align: "left" }); 
    doc.end(); 

  } catch (err) { 
    console.error("Summarization error:", err); 
    res.status(500).json({ error: err.message }); 
  } 
}); 

// Start server 
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
