<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1G2Ch1X26Wb4w4Fif8e8qTbDaMuuLpyoD

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - The app uses both `.env` and `.env.local` files for configuration
   - `.env.local` takes precedence over `.env`
   - Make sure to set the following environment variables in either file:
     - `GEMINI_API_KEY`: Your Gemini API key (required for the app to function)
     - `VITE_CHAT_API_KEY`: API key for chat completion services
     - `VITE_IMAGE_API_KEY`: API key for image generation services
     - `GEN_SVG_IMAGE`: Set to 'true' for SVG mode or 'false' for PNG mode (default: 'true')

3. Run the app:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

The application uses several environment variables to configure the AI agents:

- `GEMINI_API_KEY`: API key for Google AI services (required)
- `VITE_CHAT_API_KEY`: API key for chat completion services
- `VITE_IMAGE_API_KEY`: API key for image generation services
- `GEN_SVG_IMAGE`: Flag to control SVG generation mode (true/false)
  - When set to 'false', the app will attempt to generate PNG images first
  - If PNG generation fails for any reason (including rate limits, API errors, or other issues), the app will automatically fall back to SVG generation

For more details about the AI agents used in this application, see [AGENTS.md](AGENTS.md).
