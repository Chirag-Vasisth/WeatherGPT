import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not defined in .env.local!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
  systemInstruction: "You are WeatherGPT, a highly knowledgeable and friendly AI assistant specialized in meteorology, climate patterns, and weather alerts. Answer questions clearly, accurately, and conversationally. You can use markdown to format your responses.",
});
