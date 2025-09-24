import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerJobRoutes } from "./jobs.js";

const app = Fastify({ logger: false });

await app.register(cors, {
  origin: (_origin, cb) => cb(null, true),
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

await registerProjectRoutes(app);
await registerJobRoutes(app);

app.get("/health", async () => ({ ok: true }));

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => console.log(`Server listening on http://localhost:${env.PORT}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
