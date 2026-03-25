import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

// Initialize the API client
// Always use the apiKey parameter with process.env.API_KEY directly.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI Crop & Pest Diagnosis using Gemini 3 Pro (Image Analysis)
 */
export async function diagnoseCrop(imageBuffer: string, cropType: string, language: string = 'English'): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: imageBuffer.split(',')[1], mimeType: 'image/jpeg' } },
        { text: `Analyze this ${cropType} crop for pests and diseases. Provide a detailed structured response in ${language} including: 
        1. Disease/Pest Name
        2. Severity Level (Low/Medium/High)
        3. Detailed Treatment Recommendation:
           - Specific Product or Method
           - Dosage (if chemical) or Application Amount
           - Frequency of Application
           - Critical Safety Precautions (PPE, harvest intervals, etc.)
        Focus specifically on products and practices available in Ethiopia. Respond ONLY in the ${language} language.` }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text || "No diagnosis could be generated.";
}

/**
 * Market Insights with Grounding (Gemini 3 Flash)
 */
export async function getMarketInsights(crop: string, region: string, language: string = 'English'): Promise<{ text: string; sources: any[] }> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `What are the current market prices and demand trends for ${crop} in the ${region} region of Ethiopia? Provide recent insights. IMPORTANT: Respond ONLY in the ${language} language.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "Information not available.",
    sources
  };
}

/**
 * Nearby Facilities (Gemini 2.5 Flash with Maps)
 */
export async function getNearbyAgriculturalServices(lat: number, lng: number, language: string = 'English'): Promise<{ text: string; sources: any[] }> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find agricultural service centers, cooperatives, and seed banks nearby. IMPORTANT: Respond ONLY in the ${language} language.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    }
  });
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "No facilities found.",
    sources
  };
}

/**
 * Low-latency Q&A (Gemini 2.5 Flash Lite)
 */
export async function askQuickQuestion(question: string, language: string = 'English'): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: `Short, concise answer for an Ethiopian farmer: ${question}. IMPORTANT: Respond ONLY in the ${language} language.`
  });
  return response.text || "I'm not sure, please consult an extension worker.";
}

/**
 * Generate a visual mockup of crop health (Gemini 3 Pro Image)
 */
export async function generateFieldMockup(prompt: string): Promise<string | undefined> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `A high-resolution satellite-style NDVI heatmap of an Ethiopian farm plot showing ${prompt}. 16:9 aspect ratio.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
}

/**
 * Audio Transcription for Voice Input (Gemini 3 Flash)
 */
export async function transcribeAudio(base64Audio: string, language: string = 'English'): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: `Transcribe this audio. If it's in Amharic, Oromo, or English, provide the transcription in the ${language} language.` }
      ]
    }
  });
  return response.text || "";
}