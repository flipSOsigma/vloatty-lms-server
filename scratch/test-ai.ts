import dotenv from "dotenv";
import path from "path";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY from .env:", apiKey);
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log("Requesting gemini-2.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log("Response text:", response.text);
  } catch (error: any) {
    console.error("Error occurred while calling Gemini API:");
    console.error(error);
  }
}

run();
