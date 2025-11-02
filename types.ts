
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Type definitions for Puter.js AI module
type PuterStreamChunk = { text?: string };
type PuterChatStreamResponse = AsyncIterable<PuterStreamChunk>;
type PuterChatOptions = { model: string; stream?: boolean };

interface PuterAI {
  chat: (prompt: string, options: PuterChatOptions) => Promise<PuterChatStreamResponse>;
}
interface Puter {
  ai: PuterAI;
}

// Window interface augmentation for aistudio and puter
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    puter?: Puter;
  }
}