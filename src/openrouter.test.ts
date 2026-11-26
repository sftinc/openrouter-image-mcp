import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { test } from 'node:test'
import { outputDir, resolveInput } from './openrouter.js'

test('resolveInput', async () => {
	assert.equal(await resolveInput('https://example.com/a.png'), 'https://example.com/a.png')
	assert.equal(await resolveInput('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA')
	assert.equal(await resolveInput('/9j/AAAA'), 'data:image/png;base64,/9j/AAAA')

	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-image-'))
	await fs.writeFile(path.join(dir, 'a.JPG'), 'hi')
	assert.equal(await resolveInput(path.join(dir, 'a.JPG')), 'data:image/jpeg;base64,aGk=')

	// Non-image files must never be read and uploaded.
	await fs.writeFile(path.join(dir, 'id_rsa'), 'secret')
	await assert.rejects(resolveInput(path.join(dir, 'id_rsa')), /Not a supported image input/)
	await assert.rejects(resolveInput('~/.ssh/config'), /Not a supported image input/)
})

test('outputDir', async () => {
	const cwd = process.cwd()
	try {
		process.env.OUTPUT_DIR = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-image-')), 'out')
		assert.equal(await outputDir(), process.env.OUTPUT_DIR)
		delete process.env.OUTPUT_DIR

		const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-image-')))
		process.chdir(dir)
		assert.equal(await outputDir(), path.join(dir, 'generated_images'))

		// Started at the filesystem root, as Claude Desktop does: Downloads, else home.
		process.chdir(path.parse(cwd).root)
		const downloads = path.join(os.homedir(), 'Downloads')
		const hasDownloads = await fs.stat(downloads).then((s) => s.isDirectory(), () => false)
		assert.equal(await outputDir(), hasDownloads ? downloads : os.homedir())
	} finally {
		process.chdir(cwd)
	}
})
