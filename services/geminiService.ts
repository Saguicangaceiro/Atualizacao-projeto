import { GoogleGenAI, Type } from "@google/genai";

// Re-implementing the suggestion service following strict @google/genai guidelines.
export const suggestMaterials = async (
  description: string,
  inventoryList: string[]
): Promise<{ material: string; reason: string }[]> => {
  // Access the API key directly from process.env.API_KEY as required.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment");
    return [];
  }

  // Create a new instance right before making an API call to ensure it's up-to-date.
  const ai = new GoogleGenAI({ apiKey });

  try {
    const inventoryString = inventoryList.join(", ");
    
    const prompt = `
      Você é um assistente especialista em manutenção industrial.
      Analise a seguinte descrição de uma Ordem de Serviço: "${description}".
      
      Com base no estoque disponível abaixo, sugira quais materiais provavelmente serão necessários.
      Estoque disponível: [${inventoryString}]
      
      Retorne APENAS itens que existem no estoque ou itens genéricos muito óbvios.
      Seja conciso.
    `;

    // Calling generateContent directly on the models interface with the specified model and prompt.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              material: { type: Type.STRING, description: "Nome do material sugerido" },
              reason: { type: Type.STRING, description: "Breve motivo da escolha" }
            },
            required: ["material", "reason"]
          }
        }
      }
    });

    // Access the .text property directly (do not call it as a function).
    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return [];

  } catch (error) {
    console.error("Error fetching suggestions from Gemini:", error);
    return [];
  }
};
