# Market Resolution Chatbot

A comprehensive system for interacting with prediction markets through multiple interfaces. The project consists of three main components: a blockchain data fetcher, a web API service, and a Chrome extension for seamless market interaction.

## Project Structure

The project is organized into three distinct components:

### Core Data Fetcher
- `app.js` - Main script that fetches market data from blockchain and syncs to Airtable
- `fetch.js` - Blockchain interaction utilities for retrieving market events and details
- `abi.json` - Smart contract ABI for market contract interaction

### Web API Service (`honc-app/`)
A Cloudflare Workers-based API service built with Hono framework providing:
- RESTful API endpoints for market data retrieval
- OpenAI-powered chatbot functionality with market context
- Real-time streaming responses
- Integration with Airtable for data persistence

### Chrome Extension (`chrome-extension/`)
A full-featured browser extension offering:
- Popup interface for quick market queries
- Side panel for extended interactions
- Content scripts for web page integration
- Background services for data synchronization

### Landing Page (`landingpage/`)
Next.js-based landing page for the service.

## Technologies

### Backend
- **Node.js** with ethers.js for blockchain interaction
- **Hono** framework on Cloudflare Workers for API services
- **Drizzle ORM** for database operations
- **OpenAI API** for natural language processing
- **Airtable** for data storage and management

### Frontend
- **React** with TypeScript for Chrome extension
- **Next.js** for landing page
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Blockchain
- **Ethereum RPC** integration via ethers.js
- **Smart contract** interaction for market data retrieval
- **Event filtering** for efficient data synchronization

## Setup

### Environment Variables
Create `.env` files in the root directory and `honc-app/` with:

```
OPENAI_API_KEY=your_openai_api_key
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=your_table_name
```

For Cloudflare Workers, use `.dev.vars` instead of `.env` in the `honc-app/` directory.

### Installation

#### Using Docker (Recommended)
```bash
docker-compose up --build
```

#### Manual Installation
```bash
npm install
cd honc-app && npm install
cd ../chrome-extension && pnpm install
cd ../landingpage && npm install
```

### Running the Services

#### Data Fetcher
```bash
node app.js
```

#### API Service
```bash
cd honc-app
npm run dev
```

#### Chrome Extension
```bash
cd chrome-extension
pnpm dev
```

#### Landing Page
```bash
cd landingpage
npm run dev
```

## API Endpoints

### Market Data
- `GET /markets` - Retrieve markets with optional filtering
- `GET /markets/:id` - Get detailed market information

### Chatbot
- `POST /chat` - Send message to chatbot
- `POST /chat/stream` - Streaming chatbot responses

Query parameters support filtering by status, category, and search terms.

## Data Flow

1. **Blockchain Sync**: `app.js` fetches market events from smart contract
2. **Data Processing**: Market metadata is retrieved and processed
3. **Storage**: Processed data is stored in Airtable
4. **API Access**: Hono service provides structured API access to market data
5. **AI Integration**: OpenAI processes user queries with market context
6. **User Interface**: Chrome extension and web interfaces consume API services

## Development

The project uses modern development practices including:
- TypeScript for type safety
- ESLint and Biome for code quality
- Vitest for testing
- Turbo for monorepo management (Chrome extension)
- Hot module replacement for development

## Smart Contract Integration

The system integrates with a prediction market smart contract deployed on a testnet, fetching:
- Market creation events
- Market status updates
- Resolution data
- Collateral information
- Metadata URIs

Contract interactions are optimized with chunked event fetching to handle rate limits and large block ranges efficiently.