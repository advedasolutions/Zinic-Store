
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

/**
 * GEMINI AI SERVICE
 * 
 * Provides intelligent auditing and insights for hotel inventory management.
 */
export const geminiService = {
  /**
   * Generates audit summaries and recommendations based on current inventory data.
   * Uses gemini-3-pro-preview for complex reasoning and structured JSON output.
   */
  async getInventoryInsights(items: InventoryItem[]) {
    // Hard requirement: use process.env.API_KEY and proper named parameter constructor
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for advanced inventory reasoning as specified in guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform an inventory health audit for this hotel. 
      Identify critical shortages, overstock items, and procurement risks based on current stock vs min levels.
      
      Inventory Data: ${JSON.stringify(items.map(i => ({ 
        name: i.name, 
        stock: i.currentStock, 
        min: i.minStockLevel, 
        category: i.category,
        unit: i.unit
      })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A comprehensive executive summary of inventory status."
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "A list of 3 specific, actionable steps for the hotel manager."
            }
          },
          required: ["summary", "recommendations"]
        }
      },
    });

    try {
      // response.text is a getter property, not a method, as per guidelines
      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Received empty response from AI engine.");
      
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Neural Link Audit Error:", e);
      return { 
        summary: "Neural link established but data parsing failed. Manual audit recommended.",
        recommendations: [
          "Check items currently below threshold levels",
          "Review vendor lead times for perishable goods",
          "Ensure pending requisitions are authorized"
        ] 
      };
    }
  }
};
