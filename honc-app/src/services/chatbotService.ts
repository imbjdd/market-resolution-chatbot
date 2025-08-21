import OpenAI from "openai";
import { getMarkets, getMarketDetails } from './airtableService';

const marketTools = [
    {
        type: "function" as const,
        function: {
            name: "get_markets",
            description: "Get prediction markets data from Airtable. Can filter by status, category, or search in titles/descriptions.",
            parameters: {
                type: "object",
                properties: {
                    status: {
                        type: "string",
                        description: "Filter by market status: PENDING, ACTIVE, RESOLVED, CLOSED",
                    },
                    category: {
                        type: "string",
                        description: "Filter by market category",
                    },
                    search: {
                        type: "string",
                        description: "Search term to find in market titles or descriptions",
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of markets to return (default: 10)",
                    }
                },
                required: [],
            },
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_market_details",
            description: "Get detailed information about a specific market by its ID.",
            parameters: {
                type: "object",
                properties: {
                    marketId: {
                        type: "string",
                        description: "The Market ID to get details for",
                    },
                },
                required: ["marketId"],
            },
        }
    }
];

// Helper function to detect Market IDs in messages
function detectMarketIds(message: string): string[] {
    // Regex pour détecter les Market IDs (uniquement des nombres)
    const marketIdRegex = /market\s*(?:id\s*)?[:#]?\s*(\d+)/gi;
    const matches = [];
    let match;
    
    while ((match = marketIdRegex.exec(message)) !== null) {
        const id = match[1];
        if (id) {
            matches.push(id);
        }
    }
    
    return [...new Set(matches)]; // Remove duplicates
}

export async function runChatbot(userMessage: string, env: any): Promise<{ response: string; quickActions?: Array<{type: 'show_market', label: string, marketId: string, marketUrl?: string}> }> {
    const openai = new OpenAI({ 
        apiKey: env.OPENAI_API_KEY 
    });
    
    // Détecter les Market IDs dans le message
    const detectedMarketIds = detectMarketIds(userMessage);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { 
            role: "system", 
            content: `You are a helpful assistant that provides information about prediction markets. 

CRITICAL RULE: When users ask about ANY market, you MUST ALWAYS call the get_markets function first with a search parameter before giving any response.

For questions like "Has Market X resolved?":
1. IMMEDIATELY call get_markets with search: "Market X" (and also try search: "X" if first search fails)
2. NEVER respond without searching first
3. If you find markets, provide the status directly
4. Only say you can't find anything AFTER you've actually searched

SPECIAL: If a specific Market ID is detected in the user message (${detectedMarketIds.length > 0 ? `like: ${detectedMarketIds.join(', ')}` : ''}), prioritize using get_market_details with that exact ID.

You MUST use tools for every market-related question. Do not give responses without searching first.`
        },
        { role: "user", content: userMessage }
    ];

    let response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages,
        tools: marketTools,
        tool_choice: "auto"
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
            let result;
            const args = JSON.parse(toolCall.function.arguments);
            
            if (toolCall.function.name === "get_markets") {
                result = await getMarkets(args, env);
            } else if (toolCall.function.name === "get_market_details") {
                result = await getMarketDetails(args, env);
            }

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }

        response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages,
            tools: marketTools,
            tool_choice: "auto"
        });
    }

    const finalResponse = response.choices[0].message.content;
    console.log('Final response:', finalResponse);
    console.log('Tool calls in final response:', response.choices[0].message.tool_calls);
    
    // Generate quick actions if market IDs were detected
    const quickActions: Array<{type: 'show_market', label: string, marketId: string, marketUrl?: string}> = [];
    
    if (detectedMarketIds.length > 0) {
        for (const marketId of detectedMarketIds) {
            quickActions.push({
                type: 'show_market',
                label: `View Market ${marketId}`,
                marketId: marketId,
                marketUrl: `https://alpha.xo.market/markets/${marketId}`
            });
        }
    }
    
    return {
        response: finalResponse || "No response generated",
        quickActions: quickActions.length > 0 ? quickActions : undefined
    };
}

export async function* runChatbotStream(userMessage: string, env: any): AsyncGenerator<string> {
    const openai = new OpenAI({ 
        apiKey: env.OPENAI_API_KEY 
    });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { 
            role: "system", 
            content: `You are a helpful assistant that provides information about prediction markets. 

CRITICAL RULE: When users ask about ANY market, you MUST ALWAYS call the get_markets function first with a search parameter before giving any response.

For questions like "Has Market X resolved?":
1. IMMEDIATELY call get_markets with search: "Market X" (and also try search: "X" if first search fails)
2. NEVER respond without searching first
3. If you find markets, provide the status directly
4. Only say you can't find anything AFTER you've actually searched

You MUST use tools for every market-related question. Do not give responses without searching first.`
        },
        { role: "user", content: userMessage }
    ];

    let response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages,
        tools: marketTools,
        tool_choice: "auto"
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (message.tool_calls) {        
        for (const toolCall of message.tool_calls) {
            let result;
            const args = JSON.parse(toolCall.function.arguments);
            
            if (toolCall.function.name === "get_markets") {
                result = await getMarkets(args, env);
            } else if (toolCall.function.name === "get_market_details") {
                result = await getMarketDetails(args, env);
            }

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }
        
        const streamResponse = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages,
            tools: marketTools,
            tool_choice: "none",
            stream: true
        });

        for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    } else {
        const streamResponse = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages,
            stream: true
        });

        for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
}