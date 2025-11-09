
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";
import { getProjectContext } from '../core/ai-knowledge';

// Resolve API key safely for different environments (Vite client vs serverless)
const resolveApiKey = (): string => {
    // Prefer Vite client-side env var
    const viteEnv: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
    const viteKey = viteEnv.VITE_GEMINI_API_KEY || viteEnv.VITE_API_KEY;

    // Fallback to Node/Vercel serverless env vars (only available server-side)
    const nodeKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined;

    const key = viteKey || nodeKey;
    if (!key) {
        throw new Error("Gemini API key not set. Configure VITE_GEMINI_API_KEY (client) or GEMINI_API_KEY (server).");
    }
    return key;
};

// This function creates a new instance on demand.
// Crucial for Veo to pick up the latest API key after user selection.
const getAiClient = () => {
    const apiKey = resolveApiKey();
    return new GoogleGenAI({ apiKey });
};

interface VideoGenerationImage {
    imageBytes: string;
    mimeType: string;
}

// --- Veo Video Generation ---
export const generateVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16',
    image?: VideoGenerationImage,
    model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' = 'veo-3.1-fast-generate-preview'
) => {
    const ai = getAiClient();
    
    // The type for generateVideos is not exported, so using 'any' is pragmatic here.
    const payload: any = {
        model,
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: model === 'veo-3.1-generate-preview' ? '1080p' : '720p',
            aspectRatio,
        }
    };

    if (image) {
        payload.image = {
            imageBytes: image.imageBytes,
            mimeType: image.mimeType
        };
    }
    
    return ai.models.generateVideos(payload);
};

// --- Alternative Veo via Puter.js (Experimental) ---
export const generateVideoViaPuter = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
    if (!window.puter?.ai?.chat) {
        throw new Error("Puter.js is not available for video generation.");
    }

    // Construct a specialized prompt for video generation via chat
    const videoPrompt = `FORCE VEO 3.1 VIDEO GENERATION:\n\nI need you to generate a video using your Veo 3.1 capabilities. Please execute this immediately:\n\nSPECIFICATIONS:\n- Model: veo-3.1-fast-generate-preview\n- Prompt: "${prompt}"\n- Aspect Ratio: ${aspectRatio}\n- Duration: 5-10 seconds\n- Resolution: 720p\n- Quality: High definition\n\nIMPORTANT: Please access your video generation capabilities directly and provide the video generation result or download link. This is a direct request to use Veo 3.1 video generation model.\n\nExecute this video generation request now using your Veo 3 access.`;

    try {
        const response = await window.puter.ai.chat(videoPrompt, {
            model: 'google/gemini-2.5-pro',
            stream: false,
        });
        
        return response.text || "Video generation instructions received via Puter.js";
    } catch (error) {
        throw new Error(`Puter video generation failed: ${error}`);
    }
};

// --- Force Veo 3 Call Methods ---
export const forceVeoCall = async (
    prompt: string,
    method: 'puter' | 'direct' | 'universal' = 'universal'
): Promise<string> => {
    switch (method) {
        case 'puter':
            return await generateVideoViaPuter(prompt);
            
        case 'direct':
            try {
                const ai = getAiClient();
                const operation = await ai.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt,
                    config: {
                        numberOfVideos: 1,
                        resolution: '720p',
                        aspectRatio: '16:9',
                    }
                });
                return `Direct Veo 3 call initiated: ${JSON.stringify(operation)}`;
            } catch (error) {
                throw new Error(`Direct Veo call failed: ${error}`);
            }
            
        case 'universal':
            // Try multiple methods until one works
            const methods = [
                () => forceVeoCall(prompt, 'direct'),
                () => forceVeoCall(prompt, 'puter'),
            ];
            
            for (const methodFn of methods) {
                try {
                    const result = await methodFn();
                    return result;
                } catch (error) {
                    console.log('Method failed, trying next...', error);
                }
            }
            
            throw new Error('All Veo 3 force methods failed');
            
        default:
            throw new Error(`Unknown force method: ${method}`);
    }
};

// --- Test Veo 3 Access ---
export const testVeoAccess = async (): Promise<{[key: string]: boolean}> => {
    const results: {[key: string]: boolean} = {};
    
    // Test direct API access
    try {
        const ai = getAiClient();
        // Just test if we can create the client, don't actually generate
        results.direct = !!ai;
    } catch (error) {
        results.direct = false;
    }
    
    // Test Puter.js access
    try {
        results.puter = !!(window.puter?.ai?.chat);
    } catch (error) {
        results.puter = false;
    }
    
    return results;
};

export const pollVideoStatus = async (operation: any) => {
    const ai = getAiClient();
    return ai.operations.getVideosOperation({ operation });
};

// --- Video Analysis ---
export const analyzeVideo = async (prompt: string, videoFramesAsBase64: string[]): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    
    const imageParts = videoFramesAsBase64.map(data => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data,
        }
    }));

    const textPart = { text: prompt };

    return ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [textPart, ...imageParts] },
    });
};

// --- Image Generation ---
export const generateImage = async (prompt: string) => {
    const ai = getAiClient();
    return ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });
};

// --- Image Editing ---
export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = { text: prompt };

    return ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
};

// --- Text-to-Speech ---
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate speech audio.");
    }
    return base64Audio;
};

// --- Generic Text Generation (for agent responses) ---
export const generateContent = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const projectContext = await getProjectContext();

    const enhancedPrompt = `
You are an AI assistant integrated into a web development environment.
Your task is to assist the user with their web project.
Below is the context of the project you are working on. Use this information to provide accurate and relevant responses.

${projectContext}

--- USER'S REQUEST ---
${prompt}
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ parts: [{ text: enhancedPrompt }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
};

// --- Aggregated Service (compatibility for components expecting `geminiService`) ---
export const geminiService = {
    generateContent,
    generateVideo,
    analyzeVideo,
    generateImage,
    editImage,
    generateSpeech,
    pollVideoStatus,
    forceVeoCall,
    generateVideoViaPuter,
    testVeoAccess,
};
