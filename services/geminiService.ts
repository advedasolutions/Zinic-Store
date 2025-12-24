import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

export const geminiService = {
  async getInventoryInsights(items: InventoryItem[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
          propertyOrdering: ["summary", "recommendations"],
          required: ["summary", "recommendations"]
        }
      },
    });

    try {
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