import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const origin = 'http://127.0.0.1:5173'

async function isThisAppAlreadyRunning() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const pageResponse = await fetch(`${origin}/src/pages/WorkspacePage.vue`, {
      signal: controller.signal,
    })
    if (!pageResponse.ok) return false

    const pageSource = await pageResponse.text()
    return pageSource.includes('Write with good intent')
      && pageSource.includes('HomeHighlightsSection')
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

if (await isThisAppAlreadyRunning()) {
  console.log(`Can I Write is already running at ${origin}/`)
  process.exit(0)
}

const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [viteCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
})

server.on('error', (error) => {
  console.error(`Could not start the Vite development server: ${error.message}`)
  process.exitCode = 1
})

server.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Vite stopped after receiving ${signal}`)
    process.exitCode = 1
    return
  }
  process.exitCode = code ?? 1
})
