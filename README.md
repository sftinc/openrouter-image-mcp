# MCP Image Generation Server

An MCP (Model Context Protocol) server for AI image generation via OpenRouter API.

## Features

-   **Text-to-Image Generation**: Generate images from text descriptions
-   **Image-to-Image Generation**: Transform existing images based on prompts
-   **Automatic File Saving**: Generated images are saved locally
-   **Flexible Input**: Supports local files, URLs, base64, and data URLs

## Prerequisites

-   Node.js 18+
-   An [OpenRouter](https://openrouter.ai/) API key

### Installing Node.js

**macOS:**

```bash
# Option 1: Download the installer from https://nodejs.org/en/download
# Option 2: Using Homebrew
brew install node
```

**Windows:**

Download and run the installer from [https://nodejs.org/en/download](https://nodejs.org/en/download). The LTS version (currently v24) is recommended. The installer includes npm.

Verify your installation:

```bash
node --version
npm --version
```

## Installation

```bash
npm install
npm run build
```

## Configuration

### Changing the Model

The image generation model is configured in `src/openrouter.ts`:

```typescript
const GEMINI_MODEL = 'google/gemini-3.1-flash-image-preview'
```

To use a different model, change this value to any image-capable model available on [OpenRouter](https://openrouter.ai/models). After changing, rebuild with `npm run build`.

### Claude Code Global Configuration

Add the MCP server to your global Claude config at `~/.claude.json`:

```json
{
	"mcpServers": {
		"image": {
			"command": "node",
			"args": ["/path/to/image-mcp/dist/index.js"],
			"env": {
				"OPENROUTER_API_KEY": "sk-or-your-api-key"
			}
		}
	}
}
```

### Claude Code Project-level Configuration

Add a `.mcp.json` file to your project root:

```json
{
	"mcpServers": {
		"image": {
			"command": "node",
			"args": ["/path/to/image-mcp/dist/index.js"],
			"env": {
				"OPENROUTER_API_KEY": "sk-or-your-api-key"
			}
		}
	}
}
```

Make sure `.mcp.json` is added to your `.gitignore` to avoid committing your API key.

### Claude Desktop

Add this to your config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
	"mcpServers": {
		"image": {
			"command": "node",
			"args": ["/path/to/image-mcp/dist/index.js"],
			"env": {
				"OPENROUTER_API_KEY": "sk-or-your-api-key"
			}
		}
	}
}
```

## Usage

### Available Tools

#### `generate`

Generate images from text prompts or transform existing images.

**Parameters:**

-   `prompt` (required): Text description of the image to generate
-   `filename` (required): Base filename for saved image (without extension)
-   `input_images` (optional): Array of input images for image-to-image generation, editing, or combining multiple images. Each element can be a file path, URL, base64, or data URL.
-   `show_full_response` (default: false): Include base64 data in response

**Examples:**

```
Generate a photorealistic mountain landscape at sunset
```

```
Create a watercolor painting of a cat, square format
```

For image-to-image (single image):

```
input_images: ["/path/to/photo.jpg"]
prompt: "Transform this image into an oil painting style"
```

For multi-image operations:

```
input_images: ["/path/to/style-reference.jpg", "/path/to/content.jpg"]
prompt: "Apply the artistic style from the first image to the scene in the second image"
```

### Prompt Tips

Control image output through your prompt text:

-   **Aspect ratio**: "square image", "landscape orientation", "16:9 aspect ratio", "portrait 9:16"
-   **Style**: "photorealistic", "oil painting", "watercolor", "digital art", "pencil sketch"
-   **Quality**: "ultra HD", "4K", "highly detailed"
-   **Multiple images**: "Generate 3 variations of..." (model may not always follow exact count)

## Output

Generated images are saved to `./generated_images/` directory with filenames in the format:

`{sort_code}_{filename}_{index}.{ext}`

The sort code is a base36-encoded timestamp that ensures files are listed in chronological order when sorted alphabetically (e.g., `jzk5m1kv_my_logo_1.png`).

## License

MIT
