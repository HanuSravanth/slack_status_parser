import { GoogleGenAI, Type } from "@google/genai";

// Lazy initializer helper to prevent crash if key is missing
let aiInstance: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured yet. Please configure it in your Vercel Environment Variables panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
    });
  }
  return aiInstance;
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text } = req.body || {};
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
    return res.status(200).json(parsedJSON);

  } catch (error: any) {
    console.error("Gemini serverless extraction error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to process text with Gemini API", 
      details: error.toString() 
    });
  }
}
