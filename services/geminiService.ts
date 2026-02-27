
import { GoogleGenAI, Type } from "@google/genai";
import { ItemCategory, Difficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeItemImage = async (base64Image: string): Promise<{
  name: string;
  category: string;
  material: string;
  story: string;
  tags: string[];
}> => {
  try {
    const model = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: `请分析这张收集品或废旧物品的图片。识别它是什么，可能的材质，并用中文写一句富有诗意或像博物馆档案一样的描述（story）。
            
            请返回符合以下 Schema 的 JSON:
            {
              "name": "简短的中文物品名称",
              "category": "必须是以下之一: 包装, 容器, 纸质, 电子, 纺织, 其他",
              "material": "主要材质 (例如: 塑料, 玻璃, 金属)",
              "story": "一句富有创意、略带哲理的中文描述。",
              "tags": ["标签1", "标签2", "标签3"]
            }`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            material: { type: Type.STRING },
            story: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "category", "material", "story", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    
    // Normalize category: Try to match existing enum, otherwise fallback to "其他" or keep as string
    let category = ItemCategory.OTHER as string;
    const catVal = data.category;
    if (Object.values(ItemCategory).includes(catVal as ItemCategory)) {
        category = catVal;
    } else {
        // If AI returns something close, we could map it, but for now default to OTHER
        // unless we want to allow AI to create categories dynamically (not requested yet)
        category = ItemCategory.OTHER;
    }

    return { ...data, category };

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateRemuseIdeas = async (itemDescription: string, material: string): Promise<any[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `针对材质为"${material}"的"${itemDescription}"，生成3个富有创意的改造（再生）方案。
            方案应包含从简单到复杂的难度。请全部使用中文回复。
            
            返回 JSON 格式。`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "改造方案标题" },
                            description: { type: Type.STRING, description: "方案简述" },
                            difficulty: { type: Type.STRING, enum: ["简单", "中等", "困难"] },
                            materials: { type: Type.ARRAY, items: { type: Type.STRING }, description: "所需材料列表" },
                            steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "简略执行步骤" }
                        },
                        required: ["title", "description", "difficulty", "materials", "steps"]
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (e) {
        console.error(e);
        return [];
    }
}

// Generates the Sticker (Image + Drama Text)
export const generateSticker = async (base64Image: string, itemName: string): Promise<{ stickerImageUrl: string, dramaText: string }> => {
  try {
    // 1. Generate Drama Text (Text Model)
    const textResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a scriptwriter for a mini-theater of objects. Write a "Short Drama" (2 lines max) for this object: "${itemName}".
      The tone should be witty, slightly dramatic, or philosophical. It is an object speaking.
      Output ONLY the Chinese text. Do not add quotes or labels.`,
    });
    const dramaText = textResponse.text || "我是一件物品，我有话要说。";

    // 2. Generate Sticker Image (Image Edit Model)
    // We use gemini-2.5-flash-image to transform the original image into a sticker style
    // CHANGED: Prompt now asks for PURE SOLID BLACK background for Screen blending.
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Create a flat vector art sticker of this object. The sticker MUST have a thick WHITE DIE-CUT BORDER around the subject. The background MUST be PURE SOLID BLACK (#000000). High contrast, vibrant colors, minimalist design. No text, no shadows."
          }
        ]
      }
    });

    let stickerImageUrl = "";
    if (imageResponse.candidates?.[0]?.content?.parts) {
       for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
             stickerImageUrl = `data:image/png;base64,${part.inlineData.data}`;
             break;
          }
       }
    }
    
    // Fallback if image generation isn't supported in current env or fails to return image part
    if (!stickerImageUrl) {
        console.warn("Image generation returned no image data, using original as fallback.");
        stickerImageUrl = `data:image/jpeg;base64,${base64Image}`;
    }

    return { stickerImageUrl, dramaText };

  } catch (e) {
    console.error("Sticker generation failed", e);
    throw e;
  }
};
