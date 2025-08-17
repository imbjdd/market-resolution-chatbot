import { z } from "zod";
import "zod-openapi/extend";

export const ZChatRequest = z.object({
  message: z.string().min(1, "Message cannot be empty").openapi({
    example: "Show me the latest active prediction markets"
  }),
}).openapi({
  ref: "ChatRequest",
});

export const ZChatResponse = z.object({
  response: z.string().openapi({
    example: "Here are the latest active prediction markets..."
  }),
  timestamp: z.string().openapi({
    example: "2024-08-14T09:30:00.000Z"
  }),
}).openapi({
  ref: "ChatResponse",
});

export const ZMarketFilters = z.object({
  status: z.string().optional().openapi({
    example: "ACTIVE"
  }),
  category: z.string().optional().openapi({
    example: "Sports"
  }), 
  search: z.string().optional().openapi({
    example: "bitcoin"
  }),
  limit: z.number().min(1).max(100).optional().openapi({
    example: 10
  }),
}).openapi({
  ref: "MarketFilters",
});

export type ChatRequest = z.infer<typeof ZChatRequest>;
export type ChatResponse = z.infer<typeof ZChatResponse>;
export type MarketFilters = z.infer<typeof ZMarketFilters>;