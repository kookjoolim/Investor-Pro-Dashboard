
import { GoogleGenAI } from "@google/genai";

export async function getMarketAnalysis(context: string) {
  // Use process.env.API_KEY directly as per the guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class financial quantitative analyst. 
      Analyze the following market data context: ${context}. 
      
      Task:
      1. Briefly state the current macro environment (Liquidity vs Yields).
      2. Analyze how these macro trends specifically impact the growth or value stocks listed in the user's watchlist.
      3. Provide a forward-looking risk assessment.
      
      Format: Use professional Korean language. Keep it insightful but extremely concise. Use clear section headers. 
      Do not include technical jargon without context.`,
      config: {
        temperature: 0.6,
        topP: 0.9,
        // Removed maxOutputTokens to follow guidelines recommending its avoidance when possible.
      }
    });

    // Access .text property directly as per the guidelines (not a method)
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "시장 데이터를 분석하는 동안 오류가 발생했습니다. API 키와 네트워크 연결을 확인해 주세요.";
  }
}
