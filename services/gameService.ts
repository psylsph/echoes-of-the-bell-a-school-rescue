import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameStep, SvgScene } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: "The next part of the story. Describe the scene and the result of the player's action. Keep it to one to three paragraphs.",
        },
        choices: {
            type: Type.ARRAY,
            description: "A list of 3-4 possible actions the player can take next.",
            items: { type: Type.STRING },
        },
        gameOver: {
            type: Type.BOOLEAN,
            description: "Set to true if the player has won or lost the game.",
        },
        gameOverMessage: {
            type: Type.STRING,
            description: "If gameOver is true, provide a concluding message explaining the win or loss. Otherwise, this can be an empty string.",
        },
        sceneDescription: {
            type: Type.STRING,
            description: "A concise, descriptive prompt (5-15 words) for an AI image generator to create a 2D illustration of the current scene. Focus on key visual elements, characters, and the mood. Example: 'A young girl with a flashlight stands before a dark, imposing school entrance at dusk.'"
        }
    },
    required: ["story", "choices", "gameOver", "gameOverMessage", "sceneDescription"],
};

export const getNextStep = async (prompt: string): Promise<GameStep | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
                topP: 0.95,
            },
        });
        
        let jsonText = response.text.trim();
        
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("No JSON object found in the response from the AI.");
        }

        jsonText = jsonText.substring(startIndex, endIndex + 1);
        
        const parsedResponse: GameStep = JSON.parse(jsonText);
        
        // --- Data Sanitization ---
        // Clean up the choices array to remove any non-player actions the AI might have mistakenly included.
        const knownSchemaKeys = Object.keys(responseSchema.properties);
        const invalidValues = new Set([...knownSchemaKeys, 'true', 'false']);

        if (Array.isArray(parsedResponse.choices)) {
            parsedResponse.choices = parsedResponse.choices
                .map(c => String(c).trim()) // Coerce to string and trim
                .filter(choice => choice.length > 0 && !invalidValues.has(choice));
        } else {
            // If for some reason choices is not an array, default to empty to prevent errors.
            parsedResponse.choices = [];
        }
        // --- End Sanitization ---

        return parsedResponse;

    } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        throw new Error("Failed to generate the next step of the story. The AI may be experiencing issues.");
    }
};

export const generateSceneImage = async (sceneDescription: string): Promise<string | SvgScene> => {
    try {
        const genSvg = process.env.GEN_SVG_IMAGE !== 'false';
        
        if (genSvg) {
            return await generateSvgImage(sceneDescription);
        } else {
            try {
                return await generatePngImage(sceneDescription);
            } catch (error) {
                // If we get any error with PNG generation, fall back to SVG
                console.log("PNG generation failed, falling back to SVG:", error);
                return await generateSvgImage(sceneDescription);
            }
        }

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate the scene's image.");
    }
};

const generateSvgImage = async (sceneDescription: string): Promise<SvgScene> => {
    const prompt = `
        Generate a JSON object for a minimalist, symbolic SVG illustration of the following scene.
        The JSON must match this structure:
        {
          "viewBox": "string",
          "backgroundColor": "string",
          "elements": [ { "type": "string", ... } ]
        }
        - Use a dark, moody color palette.
        - Focus on simple shapes and silhouettes.
        - Respond with ONLY the raw JSON object.

        Scene: "${sceneDescription}"
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: "You are an expert at creating SVG files that are visually appealing.",
            temperature: 1.0,
        },
    });

    let jsonText = response.text.trim();
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON object found in SVG scene response.");
    }
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    const parsedResponse: SvgScene = JSON.parse(jsonText);

    if (!parsedResponse.viewBox || !parsedResponse.backgroundColor || !Array.isArray(parsedResponse.elements)) {
        throw new Error("Received invalid or incomplete SVG JSON data from the AI.");
    }

    return parsedResponse;
};

const generatePngImage = async (sceneDescription: string): Promise<string> => {
    const prompt = `2D illustration, atmospheric, slightly stylized, digital painting. ${sceneDescription}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: prompt,
    });

    // Extract the image data from the response
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const imageData = part.inlineData.data;
            return `data:image/png;base64,${imageData}`;
        }
    }
    
    throw new Error("No image data found in the API response.");
};