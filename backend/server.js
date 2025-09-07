import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = "fw_3Zknaij71rMSs71bpVjEc4uT"; // <-- your actual API key

const API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const MODEL = "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new";

// Validate API key format
if (!API_KEY?.startsWith('key_') && !API_KEY?.startsWith('fw_')) {
  console.error("ERROR: Invalid API key format. Key should start with 'key_' or 'fw_'");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Fallback: serve index.html for any unknown route (for SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.post("/summarize", async (req, res) => {
  try {
    const { text, mode } = req.body;

    const bulletInstruction = `Summarize the following document as clear bullet points. 
Each bullet should start with the bullet character (•) followed by a space, and each bullet should appear on a new line, like this:
• First point
• Second point
• Third point
After each bullet, press the Enter key before starting the next bullet (do not use the space bar to separate bullets). Do not use dashes, asterisks, or any other symbol.`;

    const paragraphInstruction = "Summarize the following document in a clear, concise paragraph.";

    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are Dobby, an AI assistant that summarizes documents accurately while maintaining key information."
        },
        {
          role: "user",
          content: mode === 'bullet'
            ? `${bulletInstruction}\n\n${text}`
            : `${paragraphInstruction}\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error("API Error Response:", data);
      throw new Error(data.error || 'API request failed');
    }

    const summary = data.choices[0].message.content;
    res.json({ summary });

  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      error: "Summarization failed",
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
