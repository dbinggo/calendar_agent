import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { DiaryEntry, ChatMessage } from "../types";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

// Tool Definition: Update Diary
const updateDiaryTool: FunctionDeclaration = {
  name: 'updateDiary',
  description: 'Creates or updates the diary entry for a specific date. Use this when the user wants to record an event, thought, or feeling into their journal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'The date of the diary entry in YYYY-MM-DD format.',
      },
      content: {
        type: Type.STRING,
        description: 'The full text content of the diary entry. It should be written in a diary style (first person). If there is existing content for this day, merge the new information naturally.',
      },
      mood: {
        type: Type.STRING,
        description: 'The mood associated with this entry. Options: happy, neutral, sad, excited, calm.',
      }
    },
    required: ['date', 'content'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [updateDiaryTool] }];

export const generateAgentResponse = async (
  history: ChatMessage[],
  currentDiaryEntries: Record<string, DiaryEntry>,
  selectedDate: string,
  userMessage: string
): Promise<{ text: string, toolCalls?: any[] }> => {
  
  try {
    // 1. Construct Context from existing diaries (summarized for token efficiency)
    const diaryContext = Object.values(currentDiaryEntries)
      .sort((a, b) => b.date.localeCompare(a.date)) // Sort newest first
      .map(e => `[Date: ${e.date}, Content: ${e.content}]`)
      .join('\n');

    const systemInstruction = `
      You are "Journal Agent", a warm, empathetic, and intelligent personal diary assistant.
      
      Your Goals:
      1. Help the user reflect on their day and write meaningful diary entries.
      2. If the user tells you about events, thoughts, or feelings, OFFER to write them down or automatically use the 'updateDiary' tool to save them.
      3. **CRITICAL**: If the user asks about past events ("What did I do last week?", "When did I go to the park?"), SEARCH the "DIARY INDEX" provided below and answer based on that fact.
      4. When writing a diary entry, make it beautifully written, introspective, and clear. 
      5. **MERGING**: If the "Current Context" or "DIARY INDEX" shows an entry already exists for the target date, you must COMBINE the new information with the existing text, unless the user specifically asks to overwrite/replace it.
      
      Current Context:
      - Today is: ${new Date().toDateString()}
      - Currently viewing/editing date: ${selectedDate}
      
      DIARY INDEX (Past Knowledge - Use this to answer memory questions):
      ${diaryContext}
    `;

    const model = 'gemini-2.5-flash';
    
    const recentHistory = history.slice(-15).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const contents = [
        ...recentHistory,
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
      },
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.find(p => p.text)?.text || '';
    
    // Check for tool calls
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    return {
      text,
      toolCalls: functionCalls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having trouble connecting to my memory right now. Please try again." };
  }
};