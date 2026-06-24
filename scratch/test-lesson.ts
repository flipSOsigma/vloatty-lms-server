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

  const title = "Velocity and Acceleration";
  const type = "learning";
  const subjectName = "Physics 101";
  const subjectDesc = "Introductory Physics course";

  const contextPart = subjectName
    ? `This lesson of type "${type}" belongs to the subject "${subjectName}"${subjectDesc ? ` (Description: ${subjectDesc})` : ""}.`
    : `This lesson is of type "${type}".`;

  const prompt = `You are an expert educational content writer. Create a brief, professional, and engaging description for a lesson/lecture with the title "${title}". ${contextPart} Keep the description concise, informative, and formatted as a short paragraph (1-3 sentences) suitable for a learning management system lesson outline.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log("Requesting gemini-2.5-flash with schema...");
    
    // Note: this.ai.models.generateContent signature:
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "A professional and concise description for the course lesson based on the provided title, type, and optional subject context."
            }
          },
          required: ["description"]
        }
      }
    });

    console.log("Response text:", response.text);
    if (response.text) {
      console.log("Parsed JSON:", JSON.parse(response.text));
    }
  } catch (error: any) {
    console.error("Error occurred while calling Gemini API:");
    console.error(error);
  }
}

run();
