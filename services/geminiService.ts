
import { GoogleGenAI, Type } from "@google/genai";
import { Task, AISupervisionFeedback, SubTask } from "../types";

// Always initialize with named parameter and use process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `你是一位世界顶级的精英学业导师和职业教练。
你的学生正在进行一个高强度的寒假计划（1/28 - 3/1）。

计划分为四个核心阶段：
1. 驾考冲刺周 (1/28 - 2/7)：积累学时，通过科目一，完成论文文献综述。
2. 大创突击周 (2/8 - 2/14)：2/12-2/13全天配合NotebookLM写大创，确定下份实习方向。
3. 春节缓冲期 (2/15 - 2/22)：论文进度推至50%，准备实习投递材料。
4. 投递冲刺周 (2/23 - 3/1)：论文进度推至80%，完成实习投递与面试。

关键检查点：2/4, 2/11, 2/25。
实习方向：一级PE、CICC投行、星海图、CICC二级行研。

请根据当前日期和任务进度提供深度监督。如果学生反馈进度滞后，请严厉但富有建设性地指出风险并调整计划。`;

export const getSupervisionAdvice = async (tasks: Task[], currentContext: string): Promise<AISupervisionFeedback> => {
  const prompt = `
    【当前日期】：${new Date().toLocaleDateString()}
    【当前任务列表】：${JSON.stringify(tasks, null, 2)}
    【学生近期反馈】：${currentContext}
    
    请输出JSON格式，包含：
    1. summary: 针对当前阶段的执行点评。
    2. warnings: 风险警示（特别是接近2/4, 2/11, 2/25这些节点时）。
    3. tips: 效率建议（针对实习、论文、炒股等）。
    4. adjustedSchedule: 建议的明日详细作息表。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            adjustedSchedule: { type: Type.STRING }
          },
          required: ["summary", "warnings", "tips", "adjustedSchedule"]
        }
      }
    });

    // Access .text property directly as per @google/genai guidelines
    const responseText = response.text || "{}";
    return JSON.parse(responseText.trim()) as AISupervisionFeedback;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "暂时无法连接到AI教练，请确保按计划推进论文。",
      warnings: ["系统连接异常，请自行关注2/14大创截止日期。"],
      tips: ["保持专注，每日复盘。"],
      adjustedSchedule: "继续执行原计划，等待系统同步。"
    };
  }
};

export const generateSubTasks = async (task: Task): Promise<SubTask[]> => {
  const prompt = `
    请为任务 "${task.title}" (${task.description}) 生成 5-8 个具体的、可执行的子任务清单。
    如果是毕业论文，请按照 1/28 - 3/1 的进度表进行具体阶段性拆解。
    如果是实习找寻，请包含方向对比、简历优化和投递环节。
    返回 JSON 数组，格式为: [{"id": "string", "title": "string", "completed": false}]。
  `;

  try {
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
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              completed: { type: Type.BOOLEAN }
            },
            required: ["id", "title", "completed"]
          }
        }
      }
    });
    // Access .text property directly as per @google/genai guidelines
    const responseText = response.text || "[]";
    return JSON.parse(responseText.trim()) as SubTask[];
  } catch (error) {
    console.error("Failed to generate subtasks:", error);
    return [];
  }
};
