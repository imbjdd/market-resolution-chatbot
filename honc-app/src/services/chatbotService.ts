import OpenAI from "openai";
import { getMarkets, getMarketDetails, getAllMarketTitles, getResolutionReason } from './airtableService';

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
            name: "get_all_market_titles",
            description: "Get a list of all market titles and IDs to help choose the right market for resolution questions.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_resolution_reason",
            description: "Get the resolution reason for a specific market by ID.",
            parameters: {
                type: "object",
                properties: {
                    marketId: {
                        type: "string",
                        description: "The Market ID to get the resolution reason for",
                    },
                },
                required: ["marketId"],
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

CRITICAL: For ANY market question, you MUST use tools. NEVER give responses without calling tools first.

If the user asks "why was X market resolved" or "tell me why the X market was resolved":
1. IMMEDIATELY call get_all_market_titles (no parameters needed)
2. Find the best matching market from the list based on the user's question
3. IMMEDIATELY call get_resolution_reason with the market ID
4. Return the exact resolution reason

For other market questions: use get_markets or get_market_details

SPECIAL: If Market ID detected (${detectedMarketIds.length > 0 ? `like: ${detectedMarketIds.join(', ')}` : ''}), use get_resolution_reason directly.

YOU MUST CALL TOOLS FOR EVERY MARKET QUESTION.`
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
            } else if (toolCall.function.name === "get_all_market_titles") {
                result = await getAllMarketTitles(env);
            } else if (toolCall.function.name === "get_resolution_reason") {
                result = await getResolutionReason(args, env);
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
            tool_choice: "none"  // Force une réponse finale, pas d'autres tool calls
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

CRITICAL: For ANY market question, you MUST use tools. NEVER give responses without calling tools first.

If the user asks "why was X market resolved" or "tell me why the X market was resolved":
1. IMMEDIATELY call get_all_market_titles (no parameters needed)
2. Find the best matching market from the list based on the user's question
3. IMMEDIATELY call get_resolution_reason with the market ID
4. Return the exact resolution reason

For other market questions: use get_markets or get_market_details

YOU MUST CALL TOOLS FOR EVERY MARKET QUESTION.`
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
            } else if (toolCall.function.name === "get_all_market_titles") {
                result = await getAllMarketTitles(env);
            } else if (toolCall.function.name === "get_resolution_reason") {
                result = await getResolutionReason(args, env);
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