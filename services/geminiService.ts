
import { GoogleGenAI, Type } from "@google/genai";
import { ItemCategory, Difficulty } from "../types";

// ============================================================
// API Key 安全策略：
//   Key 不再注入前端包，真实 Key 由服务端代理注入。
//   客户端使用占位符 'PROXIED'，SDK 仍需要一个非空值。
//   所有请求经由代理端点（开发: Vite proxy / 生产: 自建后端）。
// ============================================================
const proxyUrl = (typeof process !== 'undefined' && process.env?.GEMINI_PROXY_URL) || '/api/gemini';

const ai = new GoogleGenAI({
  apiKey: 'PROXIED',
  httpOptions: { baseUrl: proxyUrl },
});

// ============================================================
// 结构化错误系统：让用户能自助排查问题
// ============================================================

export type ErrorCategory =
  | 'NETWORK'        // 网络连接问题
  | 'IMAGE_QUALITY'  // 图片质量 / 内容问题
  | 'RATE_LIMIT'     // API 频率限制 / 额度不足
  | 'SAFETY'         // 内容安全过滤
  | 'PARSE_ERROR'    // AI 返回结果解析失败
  | 'UNKNOWN';       // 未知错误

export interface AnalysisError {
  category: ErrorCategory;
  title: string;
  message: string;
  suggestion: string;
}

/**
 * 将原始错误分类为用户友好的结构化错误
 */
function classifyError(error: unknown): AnalysisError {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errStr = errMsg.toLowerCase();

  // 网络相关
  if (
    errStr.includes('fetch') ||
    errStr.includes('network') ||
    errStr.includes('failed to fetch') ||
    errStr.includes('networkerror') ||
    errStr.includes('timeout') ||
    errStr.includes('aborted') ||
    errStr.includes('econnrefused') ||
    errStr.includes('enotfound') ||
    errStr.includes('err_connection') ||
    errStr.includes('cors')
  ) {
    return {
      category: 'NETWORK',
      title: '网络连接失败',
      message: '无法连接到 AI 分析服务。',
      suggestion: '请检查网络连接后重试。如使用 VPN，尝试切换节点。',
    };
  }

  // API 频率限制 / 额度
  if (
    errStr.includes('429') ||
    errStr.includes('rate limit') ||
    errStr.includes('quota') ||
    errStr.includes('resource exhausted') ||
    errStr.includes('too many requests')
  ) {
    return {
      category: 'RATE_LIMIT',
      title: 'AI 服务繁忙',
      message: '当前请求过于频繁或 API 额度不足。',
      suggestion: '请等待 30 秒后重试，或联系管理员检查 API 额度。',
    };
  }

  // 内容安全过滤
  if (
    errStr.includes('safety') ||
    errStr.includes('blocked') ||
    errStr.includes('harm') ||
    errStr.includes('prohibited') ||
    errStr.includes('content filter')
  ) {
    return {
      category: 'SAFETY',
      title: '图片内容受限',
      message: 'AI 安全系统认为该图片内容不适合分析。',
      suggestion: '请确保图片中只有待回收的物品，避免包含人物或敏感内容。',
    };
  }

  // 认证 / API Key
  if (
    errStr.includes('401') ||
    errStr.includes('403') ||
    errStr.includes('unauthorized') ||
    errStr.includes('forbidden') ||
    errStr.includes('api key') ||
    errStr.includes('permission')
  ) {
    return {
      category: 'NETWORK',
      title: 'API 认证失败',
      message: 'API 密钥无效或已过期。',
      suggestion: '请联系管理员更新 API 密钥配置。',
    };
  }

  // 图片无法识别（AI 返回空/无效结果）
  if (
    errStr.includes('no response') ||
    errStr.includes('empty') ||
    errStr.includes('could not') ||
    errStr.includes('unable to')
  ) {
    return {
      category: 'IMAGE_QUALITY',
      title: '图片识别困难',
      message: 'AI 未能从图片中识别出物品信息。',
      suggestion: '试试：1) 确保物品在画面中清晰居中 2) 保持背景简洁 3) 光线充足 4) 避免过度模糊',
    };
  }

  // JSON 解析失败
  if (
    errStr.includes('json') ||
    errStr.includes('parse') ||
    errStr.includes('unexpected token') ||
    errStr.includes('syntax error')
  ) {
    return {
      category: 'PARSE_ERROR',
      title: 'AI 返回异常',
      message: 'AI 返回的结果格式异常，无法解析。',
      suggestion: '这通常是临时问题，请重新拍摄或直接重试。',
    };
  }

  // 服务器错误 (500系列)
  if (
    errStr.includes('500') ||
    errStr.includes('502') ||
    errStr.includes('503') ||
    errStr.includes('504') ||
    errStr.includes('internal') ||
    errStr.includes('server error') ||
    errStr.includes('service unavailable')
  ) {
    return {
      category: 'NETWORK',
      title: 'AI 服务器错误',
      message: 'AI 服务暂时不可用。',
      suggestion: '服务端暂时异常，请等待几秒后重试。',
    };
  }

  // 兜底
  return {
    category: 'UNKNOWN',
    title: '分析遇到问题',
    message: errMsg.length > 100 ? errMsg.slice(0, 100) + '...' : errMsg,
    suggestion: '请重试。如果问题持续出现，尝试更换图片或检查网络连接。',
  };
}

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
    throw classifyError(error);
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
        console.error("Idea generation failed:", e);
        return [];
    }
}

/**
 * 客户端 Canvas 抠图：将纯黑/近黑背景像素替换为透明。
 * 使用亮度+平滑过渡算法，避免硬边缘。
 */
export const removeBlackBackground = (
  imageUrl: string,
  threshold: number = 40,
  feather: number = 25
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // 计算到纯黑的欧几里得距离
        const brightness = Math.sqrt(r * r + g * g + b * b); // 0 ~ 441.67

        if (brightness <= threshold) {
          data[i + 3] = 0; // 完全透明
        } else if (brightness <= threshold + feather) {
          // 平滑过渡，避免硬边缘锯齿
          data[i + 3] = Math.round(((brightness - threshold) / feather) * 255);
        }
        // else: 保持原始不透明度
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Generates the Sticker (Image + Drama Text)
export const generateSticker = async (base64Image: string, itemName: string): Promise<{ stickerImageUrl: string, dramaText: string }> => {
  try {
    // 并行执行：文本生成 + 图片生成，大幅提升速度
    const [textResponse, imageResponse] = await Promise.all([
      // 1. Generate Drama Text (Text Model - fast)
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a scriptwriter for a mini-theater of objects. Write a "Short Drama" (2 lines max) for this object: "${itemName}".
        The tone should be witty, slightly dramatic, or philosophical. It is an object speaking.
        Output ONLY the Chinese text. Do not add quotes or labels.`,
      }),
      // 2. Generate Sticker Image (Image Edit Model)
      ai.models.generateContent({
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
      })
    ]);

    const dramaText = textResponse.text || "我是一件物品，我有话要说。";

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

    // 关键：客户端 Canvas 真抠图 —— 将黑色背景替换为透明像素
    stickerImageUrl = await removeBlackBackground(stickerImageUrl);

    return { stickerImageUrl, dramaText };

  } catch (e) {
    console.error("Sticker generation failed", e);
    throw classifyError(e);
  }
};
