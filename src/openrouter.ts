import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { systemPrompt } from './prompt.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'
const GEMINI_MODEL = 'google/gemini-3.1-flash-image-preview'

type ImageInput = {
	url?: string
	b64_json?: string
	base64?: string
	bytes?: ArrayBuffer | Uint8Array | Buffer
	mimeType?: string
	contentType?: string
}

export type GenerateImageParams = {
	prompt: string
	input_images?: string[]
	filename?: string
	show_full_response?: boolean
	aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
	image_size?: '1K' | '2K' | '4K'
}

export type GenerateImageResult = {
	success: boolean
	statusCode: number
	model: string
	provider?: string
	prompt: string
	message: string
	image?: {
		format: string
		size: string
		data?: string
		saved_to?: string
	}
	usage?: { tokens: number }
}

// API key validation
const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) {
	console.error('WARNING: OPENROUTER_API_KEY environment variable is not set')
} else {
	console.error('API Key loaded: ✓')
}

function validateApiKey(): string {
	if (!apiKey) {
		throw new Error(
			'OPENROUTER_API_KEY environment variable is not set. Please set it in your Claude Desktop config or environment.'
		)
	}
	if (apiKey.length < 20) {
		throw new Error('OPENROUTER_API_KEY appears to be invalid (too short). Please check your API key.')
	}
	if (!apiKey.startsWith('sk-or-')) {
		console.error('Warning: OpenRouter API keys typically start with "sk-or-". Your key may be invalid.')
	}
	return apiKey
}

// Image utility functions
function toAlphaCode(n: number): string {
	let result = ''
	while (n > 0) {
		result = String.fromCharCode(97 + (n % 26)) + result
		n = Math.floor(n / 26)
	}
	return result.padStart(9, 'a')
}

function sanitizeFilePart(s: string): string {
	return s.replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 64)
}

function mimeToExt(m?: string | null): string | undefined {
	if (!m) return undefined
	const clean = m.split(';')[0].trim().toLowerCase()
	const map: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/bmp': 'bmp',
		'image/tiff': 'tiff',
		'image/avif': 'avif',
		'image/svg+xml': 'svg',
	}
	return map[clean]
}

function extFromUrl(u: string): string | undefined {
	try {
		const ext = path.extname(new URL(u).pathname).slice(1).toLowerCase()
		const allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico', 'avif']
		if (!ext || !allowed.includes(ext)) return undefined
		return ext === 'jpeg' ? 'jpg' : ext
	} catch {
		return undefined
	}
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime?: string } {
	const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/i)
	if (!m) throw new Error('Invalid data URL')
	const mime = m[1]
	const isBase64 = !!m[2]
	const data = m[3]
	const buffer = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data), 'utf8')
	return { buffer, mime }
}

async function resolveImageBufferAndExt(image: ImageInput): Promise<{ buffer: Buffer; ext: string }> {
	let buffer: Buffer | undefined
	let mime: string | undefined
	let ext: string | undefined

	if (image.url) {
		if (image.url.startsWith('data:')) {
			const parsed = parseDataUrl(image.url)
			buffer = parsed.buffer
			mime = parsed.mime
		} else {
			const res = await fetch(image.url)
			if (!res.ok) {
				throw new Error(`Failed to fetch ${image.url}: ${res.status} ${res.statusText}`)
			}
			const arr = await res.arrayBuffer()
			buffer = Buffer.from(arr)
			mime = res.headers.get('content-type') ?? undefined
			ext = extFromUrl(image.url) ?? undefined
		}
	} else if (image.b64_json || image.base64) {
		const b64 = (image.b64_json ?? image.base64)!.replace(/^data:.*;base64,/, '')
		buffer = Buffer.from(b64, 'base64')
		mime = image.mimeType ?? image.contentType
	} else if (image.bytes) {
		if (Buffer.isBuffer(image.bytes)) {
			buffer = image.bytes
		} else if (image.bytes instanceof ArrayBuffer) {
			buffer = Buffer.from(image.bytes)
		} else if (image.bytes instanceof Uint8Array) {
			buffer = Buffer.from(image.bytes)
		}
		mime = image.mimeType ?? image.contentType
	}

	if (!buffer) throw new Error('No image data found')

	const resolvedExt = mimeToExt(mime) ?? ext ?? 'png'
	return { buffer, ext: resolvedExt }
}

async function saveImages(images: ImageInput[], baseFilename: string): Promise<string[]> {
	const savedFiles: string[] = []
	const outputDir = path.join(process.cwd(), 'generated_images')
	await fs.mkdir(outputDir, { recursive: true })

	for (let i = 0; i < images.length; i++) {
		const image = images[i]
		try {
			const { buffer, ext } = await resolveImageBufferAndExt(image)
			const safeBase = sanitizeFilePart(baseFilename || 'generated_image')
			const sortCode = toAlphaCode(Date.now())
			const filename = images.length > 1
				? `${sortCode}_${safeBase}_${i + 1}.${ext}`
				: `${sortCode}_${safeBase}.${ext}`
			const filepath = path.join(outputDir, filename)

			await fs.writeFile(filepath, buffer)
			savedFiles.push(filepath)
			console.error(`Saved image to: ${filepath}`)
		} catch (err) {
			console.error(`Failed to save image #${i + 1}:`, err)
		}
	}

	return savedFiles
}

async function convertInputToImageUrl(input: string): Promise<string> {
	if (input.startsWith('data:')) {
		return input
	}
	if (input.startsWith('http://') || input.startsWith('https://')) {
		return input
	}
	if (input.startsWith('/') || input.match(/^[A-Za-z]:\\/)) {
		const fileBuffer = await fs.readFile(input)
		const ext = path.extname(input).slice(1).toLowerCase()
		const mimeMap: Record<string, string> = {
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			gif: 'image/gif',
			webp: 'image/webp',
			bmp: 'image/bmp',
		}
		const mime = mimeMap[ext] || 'image/png'
		return `data:${mime};base64,${fileBuffer.toString('base64')}`
	}
	return `data:image/png;base64,${input}`
}

export async function generateImage({
	prompt,
	input_images,
	filename,
	show_full_response = false,
	aspect_ratio,
	image_size,
}: GenerateImageParams): Promise<GenerateImageResult> {
	const key = validateApiKey()

	let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>

	if (input_images && input_images.length > 0) {
		const imageUrls = await Promise.all(input_images.map(convertInputToImageUrl))
		messageContent = [
			...imageUrls.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
			{ type: 'text' as const, text: prompt },
		]
	} else {
		messageContent = prompt
	}

	const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			// 'HTTP-Referer': 'https://yourapp.example.com',
			'X-Title': 'Image Generation MCP Server',
		},
		body: JSON.stringify({
			model: GEMINI_MODEL,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: messageContent },
			],
			...(aspect_ratio || image_size
				? {
						image_config: {
							...(aspect_ratio ? { aspect_ratio } : {}),
							...(image_size ? { image_size } : {}),
						},
					}
				: {}),
		}),
	})

	if (!response.ok) {
		let message = `OpenRouter API error: ${response.status}`
		let provider: string | undefined
		try {
			const errorBody = await response.json() as {
				error?: { message?: string; metadata?: { provider_name?: string; raw?: string } }
			}
			provider = errorBody.error?.metadata?.provider_name
			message = errorBody.error?.metadata?.raw || errorBody.error?.message || message
		} catch {
			// ignore parse errors
		}
		return {
			success: false,
			statusCode: response.status,
			model: GEMINI_MODEL,
			provider,
			prompt,
			message,
		}
	}

	const data = (await response.json()) as {
		choices: Array<{ message: { content?: string; images?: Array<{ image_url?: { url?: string } }> } }>
		usage?: { total_tokens?: number }
		provider?: string
	}
	const message = data.choices[0].message
	const content = message.content || ''

	// Extract base64 image from response
	let imageData: string | null = null

	if (message.images && message.images.length > 0) {
		const firstImage = message.images[0]
		if (firstImage.image_url?.url) {
			imageData = firstImage.image_url.url
		}
	} else if (content.startsWith('data:image')) {
		imageData = content
	}

	let savedFile: string | null = null
	if (imageData) {
		const imageInput: ImageInput = imageData.startsWith('data:') ? { url: imageData } : { base64: imageData }
		const savedFiles = await saveImages([imageInput], filename || 'generated_image')
		savedFile = savedFiles[0] || null
	}

	const result: GenerateImageResult = {
		success: true,
		statusCode: response.status,
		model: GEMINI_MODEL,
		provider: data.provider,
		prompt,
		message: content || 'Image generated successfully',
	}

	if (imageData) {
		const format = imageData.startsWith('data:image')
			? imageData.substring(11, imageData.indexOf(';')) || 'unknown'
			: 'png'
		result.image = {
			format,
			size: `${Math.round(imageData.length / 1024)}KB`,
			saved_to: savedFile || undefined,
		}
		if (show_full_response) {
			result.image.data = imageData
		}
	}

	if (data.usage) {
		result.usage = { tokens: data.usage.total_tokens || 0 }
	}

	return result
}
