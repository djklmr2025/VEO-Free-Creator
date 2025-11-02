
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";

// This function creates a new instance on demand.
// Crucial for Veo to pick up the latest API key after user selection.
const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface VideoGenerationImage {
    imageBytes: string;
    mimeType: string;
}

// --- Veo Video Generation ---
export const generateVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16',
    image?: VideoGenerationImage
) => {
    const ai = getAiClient();
    
    // The type for generateVideos is not exported, so using 'any' is pragmatic here.
    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
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
