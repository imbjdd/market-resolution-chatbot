import { createFiberplane } from "@fiberplane/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPISpecs } from "hono-openapi";
import { HTTPException } from "hono/http-exception";
import { dbProvider } from "./middleware/dbProvider";
import { chatbotRoutes } from "./routes/chatbot";

const api = new Hono()
  .use("*", dbProvider);

const app = new Hono()
  .use("*", cors({
    origin: ["http://localhost:8080", "chrome-extension://*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  }))
  .get("/", (c) => {
    return c.text("Market Prediction Chatbot API! 🤖📈");
  })
  .route("/api", api)
  .route("/api/chatbot", chatbotRoutes);

app.onError((error, c) => {
  console.error(error);
  if (error instanceof HTTPException) {
    return c.json(
      {
        message: error.message,
      },
      error.status,
    );
  }

  return c.json(
    {
      message: "Something went wrong",
    },
    500,
  );
});

/**
 * Generate OpenAPI spec at /openapi.json
 */
app.get(
  "/openapi.json",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Market Prediction Chatbot API",
        version: "1.0.0",
        description: "AI-powered chatbot for prediction market insights",
      },
    },
  }),
);

/**
 * Mount the Fiberplane api explorer to be able to make requests against your API.
 *
 * Visit the explorer at `/fp`
 */
app.use(
  "/fp/*",
  createFiberplane({
    app,
    openapi: { url: "/openapi.json" },
  }),
);

export default app;
