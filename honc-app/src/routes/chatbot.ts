import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { ZChatRequest, ZChatResponse, ZMarketFilters } from "../dtos/chatbot";
import { zodValidator } from "../middleware/validator";
import { runChatbot, runChatbotStream } from "../services/chatbotService";
import { getMarkets, getMarketDetails } from "../services/airtableService";

export const chatbotRoutes = new Hono()
  .post(
    "/chat",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Send a message to the market prediction chatbot",
      responses: {
        200: {
          description: "Chat response generated successfully",
          content: {
            "application/json": {
              schema: resolver(ZChatResponse),
            },
          },
        },
        400: {
          description: "Invalid request body",
        },
        500: {
          description: "Internal server error",
        },
      },
    }),
    zodValidator("json", ZChatRequest),
    async (c) => {
      try {
        const { message } = c.req.valid("json");
        const result = await runChatbot(message, c.env);
        
        return c.json({
          response: result.response,
          timestamp: new Date().toISOString(),
          quickActions: result.quickActions
        });
      } catch (error: any) {
        return c.json({ error: error.message }, 500);
      }
    }
  )
  .post(
    "/chat/stream",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Send a message to the market prediction chatbot (streaming response)",
      responses: {
        200: {
          description: "Streaming chat response",
          content: {
            "text/plain": {
              schema: { type: "string" }
            },
          },
        },
        400: {
          description: "Invalid request body",
        },
        500: {
          description: "Internal server error",
        },
      },
    }),
    zodValidator("json", ZChatRequest),
    async (c) => {
      try {
        const { message } = c.req.valid("json");
        
        return streamText(c, async (stream) => {
          for await (const chunk of runChatbotStream(message, c.env)) {
            await stream.write(chunk);
          }
        });
      } catch (error: any) {
        return c.json({ error: error.message }, 500);
      }
    }
  )
  .get(
    "/markets",
    describeRoute({
      tags: ["Markets"],
      summary: "Get prediction markets data",
      responses: {
        200: {
          description: "Markets retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  markets: {
                    type: "array",
                    items: { type: "object" }
                  },
                  count: { type: "number" }
                }
              }
            },
          },
        },
      },
    }),
    zodValidator("query", ZMarketFilters),
    async (c) => {
      try {
        const filters = c.req.valid("query");
        const result = await getMarkets(filters, c.env);
        return c.json(result);
      } catch (error: any) {
        return c.json({ error: error.message }, 500);
      }
    }
  )
  .get(
    "/markets/:marketId",
    describeRoute({
      tags: ["Markets"],
      summary: "Get detailed information about a specific market",
      responses: {
        200: {
          description: "Market details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  market: { type: "object" }
                }
              }
            },
          },
        },
        404: {
          description: "Market not found",
        },
      },
    }),
    async (c) => {
      try {
        const marketId = c.req.param("marketId");
        const result = await getMarketDetails({ marketId }, c.env);
        
        if (result.error) {
          return c.json({ error: result.error }, 404);
        }
        
        return c.json(result);
      } catch (error: any) {
        return c.json({ error: error.message }, 500);
      }
    }
  );