import { GoogleGenAI } from "@google/genai";

export class AiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateModuleDescription(title: string, subjectName?: string, subjectDesc?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }

    const contextPart = subjectName
      ? `This module belongs to the subject "${subjectName}"${subjectDesc ? ` (Description: ${subjectDesc})` : ""}.`
      : "";

    const prompt = `You are an expert curriculum planner. Create a brief, professional, and engaging description for a course module with the title "${title}". ${contextPart} Keep the description informative yet easy to read, formatted as a short paragraph of approximately 30 to 50 words (at least 30 words) suitable for a learning management system syllabus.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "A professional and concise description for the course module based on the provided title and optional subject context."
              }
            },
            required: ["description"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response received from Gemini AI.");
      }

      const result = JSON.parse(response.text);
      return result.description || "";
    } catch (e: any) {
      console.error("Gemini AI Generation Error:", e);
      throw new Error(`Failed to generate module description: ${e.message}`);
    }
  }

  async generateLessonDescription(title: string, type: string, subjectName?: string, subjectDesc?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }

    const contextPart = subjectName
      ? `This lesson of type "${type}" belongs to the subject "${subjectName}"${subjectDesc ? ` (Description: ${subjectDesc})` : ""}.`
      : `This lesson is of type "${type}".`;

    const prompt = `You are an expert educational content writer. Create a brief, professional, and engaging description for a lesson/lecture with the title "${title}". ${contextPart} Keep the description informative yet easy to read, formatted as a short paragraph of approximately 30 to 50 words (at least 30 words) suitable for a learning management system lesson outline.`;

    try {
      const response = await this.ai.models.generateContent({
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

      if (!response.text) {
        throw new Error("Empty response received from Gemini AI.");
      }

      const result = JSON.parse(response.text);
      return result.description || "";
    } catch (e: any) {
      console.error("Gemini AI Generation Error:", e);
      throw new Error(`Failed to generate lesson description: ${e.message}`);
    }
  }

  async generateQuiz(
    lessonTitle: string,
    lessonDesc?: string,
    subjectName?: string,
    subjectDesc?: string,
    questionCount: number = 5,
    difficulty: string = "medium",
    language: string = "English"
  ): Promise<{ questionText: string; options: string[]; correctOption: number; points: number }[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }

    const contextPart = [
      subjectName ? `Subject Name: "${subjectName}"` : null,
      subjectDesc ? `Subject Description: "${subjectDesc}"` : null,
      lessonDesc ? `Lesson/Topic Description: "${lessonDesc}"` : null
    ].filter(Boolean).join(". ");

    const count = Math.min(Math.max(1, questionCount), 10);
    const difficultyPart = `The difficulty level of the quiz questions must be "${difficulty}".`;
    const languagePart = `The language of the entire quiz (questions and options) must be in "${language}".`;

    const prompt = `You are an expert educator. Create a relevant, challenging, and educational multiple-choice quiz of exactly ${count} questions based on the lesson title "${lessonTitle}". ${contextPart ? `Additional context: ${contextPart}.` : ""}
${difficultyPart}
${languagePart}
For each question:
1. Provide a clear question text in "${language}".
2. Provide exactly 4 options in "${language}".
3. Indicate the correct option as a 0-indexed index (0, 1, 2, or 3) corresponding to the correct string in the options list.
4. Set the points for each question (normally 10 points).`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    questionText: {
                      type: "string",
                      description: "The text of the multiple choice question."
                    },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      description: "Exactly 4 options for the answer."
                    },
                    correctOption: {
                      type: "integer",
                      description: "The 0-based index of the correct answer in the options array (must be between 0 and 3 inclusive)."
                    },
                    points: {
                      type: "integer",
                      description: "The point value for this question (usually 10)."
                    }
                  },
                  required: ["questionText", "options", "correctOption", "points"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response received from Gemini AI.");
      }

      const result = JSON.parse(response.text);
      return result.questions || [];
    } catch (e: any) {
      console.error("Gemini AI Quiz Generation Error:", e);
      throw new Error(`Failed to generate quiz: ${e.message}`);
    }
  }
}

export const aiService = new AiService();
