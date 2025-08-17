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

export async function runChatbot(userMessage: string, env: any): Promise<string> {
    const openai = new OpenAI({ 
        apiKey: env.OPENAI_API_KEY 
    });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { 
            role: "system", 
            content: "You are a helpful assistant that provides information about prediction markets. Use the available tools to fetch market data from Airtable when users ask about markets, trading, predictions, or specific market details."
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

    return response.choices[0].message.content || "No response";
}

export async function* runChatbotStream(userMessage: string, env: any): AsyncGenerator<string> {
    const openai = new OpenAI({ 
        apiKey: env.OPENAI_API_KEY 
    });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { 
            role: "system", 
            content: "You are a helpful assistant that provides information about prediction markets. Use the available tools to fetch market data from Airtable when users ask about markets, trading, predictions, or specific market details."
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