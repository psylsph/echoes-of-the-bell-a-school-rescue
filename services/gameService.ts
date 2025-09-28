import OpenAI from "openai";
import { GameStep, SvgScene } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const openai = process.env.VITE_CHAT_API_KEY ? new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.VITE_CHAT_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Echoes of the Bell: A School Rescue",
    },
    dangerouslyAllowBrowser: true,
}) : null;

const responseSchema = {
    type: "object",
    properties: {
        story: {
            type: "string",
            description: "The next part of the story. Describe the scene and the result of the player's action. Keep it to one to three paragraphs.",
        },
        choices: {
            type: "array",
            description: "A list of 3-4 possible actions the player can take next.",
            items: { type: "string" },
        },
        gameOver: {
            type: "boolean",
            description: "Set to true if the player has won or lost the game.",
        },
        gameOverMessage: {
            type: "string",
            description: "If gameOver is true, provide a concluding message explaining the win or loss. Otherwise, this can be an empty string.",
        },
        sceneDescription: {
            type: "string",
            description: "A concise, descriptive prompt (5-15 words) for an AI image generator to create a 2D illustration of the current scene. Focus on key visual elements, characters, and the mood. Example: 'A young girl with a flashlight stands before a dark, imposing school entrance at dusk.'"
        }
    },
    required: ["story", "choices", "gameOver", "gameOverMessage", "sceneDescription"],
};

export const getNextStep = async (prompt: string): Promise<GameStep | null> => {
    try {
        if (!openai) {
            throw new Error("VITE_CHAT_API_KEY environment variable is not set. Text generation will not work.");
        }
        
        const response = await openai.chat.completions.create({
            model: "deepseek/deepseek-chat-v3.1:free",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_INSTRUCTION
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: {
                type: "json_object"
            },
            temperature: 0.8,
            top_p: 0.95,
        });
        
        const content = response.choices[0].message.content;
        
        if (!content) {
            throw new Error("No content in the response from the AI.");
        }
        
        const parsedResponse: GameStep = JSON.parse(content);
        
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
        console.error("Error fetching from OpenRouter API:", error);
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
    if (!openai) {
        throw new Error("VITE_CHAT_API_KEY environment variable is not set. SVG generation will not work.");
    }
    
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

    const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
            {
                role: "system",
                content: "You are an expert at creating SVG files that are visually appealing."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: {
            type: "json_object"
        },
        temperature: 1.0,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
        throw new Error("No content in the response from the AI.");
    }
    
    let jsonText = content.trim();
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
    const API_KEY_REF = process.env.VITE_IMAGE_API_KEY;
    
    if (!API_KEY_REF) {
        throw new Error("VITE_IMAGE_API_KEY environment variable is not set.");
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${API_KEY_REF}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
                {
                    role: 'user',
                    content: `Generate a beautiful image of: ${sceneDescription}`,
                },
            ],
            modalities: ['image', 'text'],
        }),
    });

    const result = await response.json();

    // The generated image will be in the assistant message
    if (result.choices) {
        const message = result.choices[0].message;
        if (message.images) {
            for (const image of message.images) {
                const imageUrl = image.image_url.url; // Base64 data URL
                return imageUrl;
            }
        }
    }
    
    throw new Error("No image data found in the API response.");
};