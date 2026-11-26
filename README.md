# MCP Image Generation Server

An MCP (Model Context Protocol) server for AI image generation via OpenRouter API.

## Features

-   **Text-to-Image Generation**: Generate images from text descriptions
-   **Image-to-Image Generation**: Transform existing images based on prompts
-   **Automatic File Saving**: Generated images are saved locally
-   **Flexible Input**: Supports local files, URLs, base64, and data URLs

## Prerequisites

-   Node.js 22+
-   An [OpenRouter](https://openrouter.ai/) API key

Verify your Node.js installation:

```bash
node --version
npm --version
```

If Node.js is not installed, download it from [nodejs.org](https://nodejs.org/en/download).

## Installation

```bash
npm install
npm run build
```

## Configuration

### Changing the Model

The image generation model is configured in `src/openrouter.ts`:

```typescript
const GEMINI_MODEL = 'google/gemini-3.1-flash-image'
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
				"OPENROUTER_API_KEY": "sk-or-your-api-key",
				"OUTPUT_DIR": "/path/to/generated_images",
				"RETURN_IMAGE": "1"
			}
		}
	}
}
```

Use the full path to `node` as the command if Claude Desktop can't find it. Set `OUTPUT_DIR` here, because Claude Desktop doesn't start the server in a project folder. `RETURN_IMAGE` makes the tool return a preview that Claude Desktop shows inline.

### Environment Variables

-   `OPENROUTER_API_KEY` (required): Your OpenRouter API key
-   `OUTPUT_DIR` (optional): Folder to save images in. Default: `./generated_images/` under the folder the server was started from.
-   `RETURN_IMAGE` (optional): Set to any value to make `return_image` default to true

## Usage

### Available Tools

#### `generate`

Generate images from text prompts or transform existing images.

**Parameters:**

-   `prompt` (required): Text description of the image to generate
-   `filename` (required): Base filename for saved image (without extension)
-   `input_images` (optional): Array of input images for image-to-image generation, editing, or combining multiple images. Each element can be a file path, URL, base64, or data URL.
-   `aspect_ratio` (default: `1:1`): One of `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
-   `image_size` (default: `1K`): `1K`, `2K` or `4K`
-   `return_image` (default: false, or true when `RETURN_IMAGE` is set): Also return a small JPEG preview in the tool result, so the client can show the image. The full-size file is always saved to disk.

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

Generated images are saved to `OUTPUT_DIR`, or `./generated_images/` when it isn't set, with filenames in the format:

`{sort_code}_{filename}.{ext}`

When the model returns more than one image, each gets an index: `{sort_code}_{filename}_{index}.{ext}`.

The sort code is a base36-encoded timestamp that ensures files are listed in chronological order when sorted alphabetically (e.g., `mwws0za4_my_logo.png`).

## Development

```bash
npm test    # Build and run the tests
```

## License

MIT
