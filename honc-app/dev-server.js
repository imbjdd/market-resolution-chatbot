import { serve } from '@hono/node-server'
import app from './src/index.ts'
import dotenv from 'dotenv'

// Charger les variables d'environnement depuis .dev.vars
dotenv.config({ path: '.dev.vars' })

const port = 8787

console.log(`🚀 Server is running on http://0.0.0.0:${port}`)
console.log('✅ Using real chatbot service with your API keys')

// Créer un contexte d'environnement pour simuler Cloudflare Workers
const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME
}

serve({
  fetch: (request, env, ctx) => {
    // Injecter les variables d'environnement dans le contexte
    const modifiedRequest = new Request(request)
    return app.fetch(modifiedRequest, env || process.env, ctx)
  },
  port
})