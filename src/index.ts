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
