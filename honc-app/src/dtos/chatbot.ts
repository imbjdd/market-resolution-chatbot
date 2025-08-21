import { z } from "zod";
import "zod-openapi/extend";

export const ZChatRequest = z.object({
  message: z.string().min(1, "Message cannot be empty").openapi({
    example: "Show me the latest active prediction markets"
  }),
}).openapi({
  ref: "ChatRequest",
});

export const ZQuickAction = z.object({
  type: z.enum(["show_market"]).openapi({
    example: "show_market"
  }),
  label: z.string().openapi({
    example: "View Market #123"
  }),
  marketId: z.string().openapi({
    example: "rec123ABC456DEF"
  }),
  marketUrl: z.string().optional().openapi({
    example: "https://alpha.xo.market/markets/rec123ABC456DEF"
  })
}).openapi({
  ref: "QuickAction",
});

export const ZChatResponse = z.object({
  response: z.string().openapi({
    example: "Here are the latest active prediction markets..."
  }),
  timestamp: z.string().openapi({
    example: "2024-08-14T09:30:00.000Z"
  }),
  quickActions: z.array(ZQuickAction).optional().openapi({
    example: [{ type: "show_market", label: "View Market #123", marketId: "rec123ABC456DEF", marketUrl: "https://alpha.xo.market/markets/rec123ABC456DEF" }]
  })
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
export type QuickAction = z.infer<typeof ZQuickAction>;
export type MarketFilters = z.infer<typeof ZMarketFilters>;