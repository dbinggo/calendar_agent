export interface DiaryEntry {
  date: string; // ISO YYYY-MM-DD
  content: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'calm';
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface ToolCallResponse {
    functionCalls: {
        name: string;
        args: Record<string, any>;
    }[];
}

export enum ViewMode {
    Calendar = 'calendar',
    Split = 'split'
}
