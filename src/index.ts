#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { generateImage } from './openrouter.js'
import { promptDescription } from './prompt.js'

const server = new McpServer({ name: 'image-mcp', version: '1.0.0' }, { capabilities: { tools: {} } })

server.registerTool(
	'generate',
	{
		description:
			'Powerful image generation and editing tool. Use this for ALL image-related tasks: creating images from text descriptions, editing/modifying existing images, logo design, marketing assets, style transfer, UI mockups, and background manipulation. When the user asks to create, generate, edit, modify, design, or manipulate ANY image, use this tool. Supports local file paths, URLs, base64, and data URLs as input.',
		inputSchema: {
			prompt: z.string().describe(promptDescription),
			input_images: z
				.array(z.string())
				.optional()
				.describe(
					'Optional array of input images for image-to-image generation, editing, or combining multiple images. Each element can be a local file path, base64 string, data URL, or HTTP URL.'
				),
			filename: z.string().describe('Base filename for saved image (without extension)'),
			aspect_ratio: z
				.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'])
				.default('1:1')
				.describe(
					'Aspect ratio for the generated image. 1:1 (1024x1024), 2:3 (768x1152), 3:2 (1152x768), 3:4 (768x1024), 4:3 (1024x768), 4:5 (768x960), 5:4 (960x768), 9:16 (576x1024), 16:9 (1024x576), 21:9 (1344x576).'
				),
			image_size: z
				.enum(['1K', '2K', '4K'])
				.default('1K')
				.describe('Resolution scale for the generated image. 1K (~1 megapixel), 2K (~4 megapixels), 4K (~8 megapixels).'),
			show_full_response: z
				.boolean()
				.default(false)
				.describe('Show full response including base64 data (default: false)'),
		},
	},
	async (params) => {
		const result = await generateImage(params)
		return {
			content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
		}
	}
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error('Image Generation MCP Server running on stdio')
}

main().catch(console.error)
