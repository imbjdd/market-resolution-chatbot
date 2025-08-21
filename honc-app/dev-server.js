import { serve } from '@hono/node-server'
import app from './src/index.ts'

const port = 8787

console.log(`🚀 Server is running on http://0.0.0.0:${port}`)

serve({
  fetch: app.fetch,
  port
})