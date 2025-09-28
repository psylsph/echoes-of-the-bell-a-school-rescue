# AI Agents in Echoes of the Bell: A School Rescue

This document describes the AI agents and services used in the "Echoes of the Bell: A School Rescue" game.

## Game Narrative Agent

The primary AI agent in this game is responsible for generating the narrative content, including story progression, player choices, and scene descriptions.

### Provider: Google Gemini
- **Model**: gemini-2.5-flash
- **Purpose**: Generates the story text, player choices, and scene descriptions based on player actions
- **Configuration**:
  - Temperature: 0.8 (balanced creativity and consistency)
  - Top P: 0.95
  - Response format: Structured JSON with specific schema
  - System instruction: Detailed storytelling guidelines with puzzle mechanics

### Key Features:
- Generates atmospheric, mysterious, and engaging narrative content
- Creates logical puzzles with clues embedded in descriptions
- Provides 3-4 distinct player choices at each step
- Handles game over conditions and victory scenarios
- Generates concise scene descriptions for image generation

## Image Generation Agent

This agent is responsible for creating visual representations of game scenes.

### Provider: Google Gemini
- **Model**: gemini-2.5-flash (for SVG generation) or gemini-2.5-flash-image-preview (for PNG generation)
- **Purpose**: Creates visual representations of game scenes
- **Configuration**:
  - SVG Generation:
    - Temperature: 1.0 (maximum creativity)
    - Output: JSON-structured SVG data
  - PNG Generation:
    - Model: gemini-2.5-flash-image-preview
    - Output: PNG image (base64 encoded)

### Key Features:
- Two modes of operation:
  1. **SVG Mode**: Generates minimalist, symbolic SVG illustrations with dark, moody color palettes
  2. **PNG Mode**: Generates detailed 2D illustrations with atmospheric styling using gemini-2.5-flash-image-preview
- Controlled by the `GEN_SVG_IMAGE` environment variable
- Robust fallback mechanism: If PNG generation fails for any reason (including rate limits, API errors, or other issues), the system automatically falls back to SVG generation
- Images are cached locally to improve performance and reduce API calls

## Caching System

While not an AI agent, the caching system is crucial for optimizing the performance of AI interactions.

### Implementation:
- Local storage-based caching for generated images
- Reduces redundant API calls for previously generated scenes
- Persists between game sessions

## Environment Variables

The application uses several environment variables to configure the AI agents:

- `GEMINI_API_KEY`: API key for Google AI services
- `VITE_CHAT_API_KEY`: API key for chat completion services
- `VITE_IMAGE_API_KEY`: API key for image generation services
- `GEN_SVG_IMAGE`: Flag to control SVG generation mode (true/false)

## Future Enhancements

Potential improvements to the AI agent system:

1. **Dynamic Difficulty Adjustment**: AI could adapt puzzle complexity based on player performance
2. **Personalized Story Elements**: AI could incorporate player preferences into narrative generation
3. **Enhanced Image Personalization**: More detailed image generation based on player choices and story progression
4. **Voice Acting Integration**: AI-generated voice narration for story text
5. **Multi-language Support**: AI agents could provide content in multiple languages