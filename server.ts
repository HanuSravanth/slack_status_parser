import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initializer helper to prevent crash if key is missing on startup.
let aiInstance: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured yet. Please configure it in the Secrets panel or env files.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for status extraction
  app.post("/api/extract", async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "No Slack text provided for extraction" });
    }

    try {
      const ai = getAiClient();
      
      const prompt = `Please extract structured daily status information from this unstructured Slack message:\n\n${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert workspace intelligence assistant specializing in summarizing unstructured Slack status updates. Extract the date (YYYY-MM-DD format based on message context, default to today's date 2026-06-20 if no specific date is mentioned), employee name, primary project name, achievements/progress (as a clean array of strings), blockers/dependencies (as a clean array of strings), and next steps/plans (as a clean array of strings).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.STRING,
                description: "ISO date or readable date (e.g., '2026-06-20')",
              },
              employee_name: {
                type: Type.STRING,
                description: "The name of the employee or username reporting status. Inferred or 'Unknown' if not found.",
              },
              project_name: {
                type: Type.STRING,
                description: "The title of the main project. Inferred or 'General' if not found.",
              },
              progress: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Concise items marking tasks completed, achievements, or values delivered.",
              },
              blockers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Impediments, blockers, visual obstacles, or wait periods. Return empty array if none.",
              },
              plan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Future tasks, next actions, or goals for the next period. Return empty array if none.",
              },
            },
            required: ["date", "employee_name", "project_name", "progress", "blockers", "plan"],
          },
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response received from Gemini API");
      }

      const parsedJSON = JSON.parse(resultText);
      res.json(parsedJSON);

    } catch (error: any) {
      console.error("Gemini API extraction error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process the text with Gemini API", 
        details: error.toString() 
      });
    }
  });

  // Simple endpoint to simulate email sending
  app.post("/api/email", async (req, res) => {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields (to, subject, or body)" });
    }
    
    // Simulate email sending
    console.log(`[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nBody: ${body}\n`);
    // Wait slightly to look realistic
    await new Promise((resolve) => setTimeout(resolve, 800));
    res.json({ success: true, message: `Status report email sent successfully to ${to}!` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
