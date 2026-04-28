/**
 * AI Service
 * Abstracts the underlying AI provider (OpenAI, Anthropic, Gemini).
 * Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in .env
 * and update the ACTIVE_AI variable below.
 */

const ACTIVE_AI = process.env.ACTIVE_AI || "custom"; // "openai" | "anthropic" | "gemini" | "custom"

const SYSTEM_PROMPT = `You are an expert automotive assistant. You help users identify car brands, models, body types, and provide accurate vehicle specifications.

When analyzing car images:
- Identify the brand, model, and body type
- Estimate the year range if possible
- Describe key visual features

When answering questions:
- Be accurate and concise
- If unsure, say so rather than guessing
- Keep answers focused on automotive topics`;

// ─── OpenAI (default) ─────────────────────────────────────────────────────────
const chatWithOpenAI = async (messages, imageBase64 = null) => {
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const formattedMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  // If an image is provided, inject it into the last user message
  if (imageBase64) {
    const lastMsg = formattedMessages[formattedMessages.length - 1];
    formattedMessages[formattedMessages.length - 1] = {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" } },
        { type: "text", text: lastMsg.content || "What car is this? Provide brand, model, body type, and any notable details." },
      ],
    };
  }

  const response = await client.chat.completions.create({
    model: imageBase64 ? "gpt-4o" : "gpt-4o-mini",
    messages: formattedMessages,
    max_tokens: 1000,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
};

// ─── Anthropic Claude ─────────────────────────────────────────────────────────
const chatWithAnthropic = async (messages, imageBase64 = null) => {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const formattedMessages = messages.map((m) => ({ role: m.role, content: m.content }));

  if (imageBase64) {
    const lastMsg = formattedMessages[formattedMessages.length - 1];
    formattedMessages[formattedMessages.length - 1] = {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: lastMsg.content || "What car is this? Provide brand, model, body type, and any notable details." },
      ],
    };
  }

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    system: SYSTEM_PROMPT,
    messages: formattedMessages,
    max_tokens: 1000,
  });

  return response.content[0].text;
};

// ─── Custom AI (CARID) ───────────────────────────────────────────────────────
const chatWithCustomAI = async (messages, imageBase64 = null, mimetype = 'image/jpeg', filename = 'image.jpg') => {
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  let question = lastUserMsg ? lastUserMsg.content : "Hello";

  // If there's an image, we first identify it to get context
  if (imageBase64) {
    try {
      const analysis = await analyzeWithCustomAI(imageBase64, mimetype, filename);
      if (analysis && analysis.status !== "error" && analysis.prediction) {
        question = `[Context: The user uploaded an image of a ${analysis.prediction}. Details: ${analysis.message}] ${question}`;
      }
    } catch (err) {
      console.error("Failed to get image context for chat:", err);
    }
  }

  try {
    const response = await fetch(`${process.env.CARID_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      console.error("Custom AI Chat Error:", await response.text());
      return "Sorry, I am having trouble connecting to the AI service right now.";
    }

    const data = await response.json();
    return data.answer || "No response received.";
  } catch (err) {
    console.error("Fetch error to Custom AI chat:", err);
    return "Error communicating with AI.";
  }
};


const analyzeWithCustomAI = async (imageBase64, mimetype = 'image/jpeg', filename = 'image.jpg') => {
  try {
    const formData = new FormData();
    const buffer = Buffer.from(imageBase64, 'base64');
    const blob = new Blob([buffer], { type: mimetype });
    formData.append("file", blob, filename);

    const response = await fetch(`${process.env.CARID_API_URL}/identify`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Custom AI Identify Error:", errorText);
      return { 
        status: "error", 
        message: "API error: " + errorText,
        details: { brand: null, model: null, generation: null, color: null } 
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Fetch error to Custom AI identify:", err);
    return { 
      status: "error", 
      message: "Connection error: " + err.message,
      details: { brand: null, model: null, generation: null, color: null }
    };
  }
};


const checkCustomAIHealth = async () => {
  try {
    const response = await fetch(`${process.env.CARID_API_URL}/health`);
    return await response.json();
  } catch (err) {
    return { status: "error", error: err.message };
  }
};

const buildCustomAIIndex = async () => {
  try {
    const response = await fetch(`${process.env.CARID_API_URL}/build-index`, { method: "POST" });
    return await response.json();
  } catch (err) {
    return { status: "error", error: err.message };
  }
};

// ─── Public interface ─────────────────────────────────────────────────────────

/**
 * Send a chat message (optionally with an image) to the AI
 * @param {Array}  messages      - Array of { role: "user"|"assistant", content: string }
 * @param {string} imageBase64   - Optional base64 image string (without data: prefix)
 * @param {string} mimetype      - Optional mimetype of the image
 * @param {string} filename      - Optional filename of the image
 * @returns {Promise<string>}    - AI text response
 */
const chat = async (messages, imageBase64 = null, mimetype = 'image/jpeg', filename = 'image.jpg') => {
  switch (ACTIVE_AI) {
    case "anthropic":
      return chatWithAnthropic(messages, imageBase64);
    case "custom":
      return chatWithCustomAI(messages, imageBase64, mimetype, filename);
    case "openai":
    default:
      return chatWithOpenAI(messages, imageBase64);
  }
};

/**
 * Analyse a car image and return structured JSON
 * @param {string} imageBase64
 * @param {string} mimetype
 * @param {string} filename
 * @returns {Promise<Object>} - { brand, model, bodyType, yearRange, confidence, description }
 */
const analyzeCarImage = async (imageBase64, mimetype = 'image/jpeg', filename = 'image.jpg') => {
  if (ACTIVE_AI === "custom") {
    const data = await analyzeWithCustomAI(imageBase64, mimetype, filename);
    
    // Normalize response for the frontend/controller
    if (data.status === "error") return data;

    return {
      brand: data.details?.brand || null,
      model: data.details?.model || null,
      bodyType: data.details?.generation || null, // generation often contains body type or era
      yearRange: data.details?.generation || null,
      color: data.details?.color || null,
      confidence: data.confidence,
      description: data.message,
      prediction: data.prediction,
      status: data.status,
      webSource: data.web_source,
      angle: data.details?.angle
    };
  }

  const prompt = `Analyze this car image and respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "brand": "brand name or null",
  "model": "model name or null",
  "bodyType": "one of: Sedan, SUV, Hatchback, Coupe, Convertible, Truck, Van, Wagon, Minivan, Crossover",
  "yearRange": "e.g. 2018-2022 or null",
  "color": "primary color",
  "confidence": "high | medium | low",
  "description": "2-3 sentence summary of the car"
}`;

  const messages = [{ role: "user", content: prompt }];
  const raw = await chat(messages, imageBase64);

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { brand: null, model: null, bodyType: null, yearRange: null, confidence: "low", description: raw };
  }
};


module.exports = { chat, analyzeCarImage, checkCustomAIHealth, buildCustomAIIndex };