import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import sharp from 'sharp'
import { systemPrompt } from './prompt.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'
const GEMINI_MODEL = 'google/gemini-3.1-flash-image'
const TIMEOUT_MS = 180_000

const IMAGE_MIME: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	bmp: 'image/bmp',
}

export type GenerateImageParams = {
	prompt: string
	input_images?: string[]
	filename: string
	aspect_ratio?: string
	image_size?: string
	return_image?: boolean
}

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }

if (!process.env.OPENROUTER_API_KEY) console.error('WARNING: OPENROUTER_API_KEY environment variable is not set')

/** Turns a tool input (URL, data URL, image file path or raw base64) into a URL the API accepts. */
export async function resolveInput(input: string): Promise<string> {
	if (/^(data:|https?:\/\/)/.test(input)) return input
	const mime = IMAGE_MIME[path.extname(input).slice(1).toLowerCase()]
	if (mime) {
		// Only image files are read, so a prompt can't make the tool upload some other file.
		const file = path.resolve(input.replace(/^~(?=\/)/, os.homedir()))
		return `data:${mime};base64,${(await fs.readFile(file)).toString('base64')}`
	}
	if (/^[A-Za-z0-9+/=\s]+$/.test(input)) return `data:image/png;base64,${input}`
	throw new Error(`Not a supported image input (expected a URL, data URL, base64 or ${Object.keys(IMAGE_MIME).join('/')} file): ${input.slice(0, 200)}`)
}

function decodeImage(image: string): { buffer: Buffer; ext: string } {
	const m = image.match(/^data:image\/([a-z0-9+.-]+);base64,(.*)$/is)
	const ext = (m?.[1] ?? 'png').toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg')
	return { buffer: Buffer.from(m ? m[2] : image, 'base64'), ext }
}

export async function generateImage({
	prompt,
	input_images,
	filename,
	aspect_ratio,
	image_size,
	return_image,
}: GenerateImageParams): Promise<Content[]> {
	const key = process.env.OPENROUTER_API_KEY
	if (!key) throw new Error('OPENROUTER_API_KEY environment variable is not set. Set it in your MCP server config.')

	const imageUrls = await Promise.all((input_images ?? []).map(resolveInput))

	const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
		method: 'POST',
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			'X-Title': 'Image Generation MCP Server',
		},
		body: JSON.stringify({
			model: GEMINI_MODEL,
			messages: [
				{ role: 'system', content: systemPrompt },
				{
					role: 'user',
					content: [...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })), { type: 'text', text: prompt }],
				},
			],
			image_config: { aspect_ratio, image_size },
		}),
	})

	const data = (await response.json().catch(() => ({}))) as {
		choices?: Array<{ finish_reason?: string; native_finish_reason?: string; message?: { content?: string; images?: Array<{ image_url?: { url?: string } }> } }>
		usage?: { total_tokens?: number }
		provider?: string
		error?: { message?: string; metadata?: { provider_name?: string; raw?: string } }
	}
	if (!response.ok || data.error) {
		const provider = data.error?.metadata?.provider_name
		throw new Error(
			`OpenRouter error ${response.status}${provider ? ` (${provider})` : ''}: ${data.error?.metadata?.raw || data.error?.message || response.statusText}`,
		)
	}

	const choice = data.choices?.[0]
	const message = choice?.message
	const content = message?.content ?? ''
	const images = (message?.images ?? []).map((i) => i.image_url?.url).filter((u): u is string => !!u)
	if (!images.length && content.startsWith('data:image')) images.push(content)
	if (!images.length) throw new Error(
			`The model returned no image (finish reason: ${choice?.native_finish_reason ?? choice?.finish_reason ?? 'unknown'}). Its reply: ${content || '(empty)'}`,
		)

	const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'generated_images')
	await fs.mkdir(outputDir, { recursive: true })
	const base = `${Date.now().toString(36)}_${filename.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 64) || 'generated_image'}`

	const saved: Array<{ saved_to: string; size: string }> = []
	const previews: Content[] = []
	for (const [i, image] of images.entries()) {
		const { buffer, ext } = decodeImage(image)
		const filepath = path.join(outputDir, `${base}${images.length > 1 ? `_${i + 1}` : ''}.${ext}`)
		await fs.writeFile(filepath, buffer)
		saved.push({ saved_to: filepath, size: `${Math.round(buffer.length / 1024)}KB` })
		if (return_image) {
			// A small JPEG keeps the tool result well under client size limits; the file on disk is full size.
			const preview = await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
			previews.push({ type: 'image', data: preview.toString('base64'), mimeType: 'image/jpeg' })
		}
	}

	const summary = {
		model: GEMINI_MODEL,
		provider: data.provider,
		message: content.startsWith('data:image') ? '' : content,
		images: saved,
		tokens: data.usage?.total_tokens,
	}
	return [{ type: 'text', text: JSON.stringify(summary, null, 2) }, ...previews]
}
