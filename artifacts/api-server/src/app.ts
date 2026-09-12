import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from "path";
import fs from "fs";

app.use("/api", router);

// Serve static frontend build if present
const candidatePaths = [
  path.resolve(process.cwd(), "../cloudnotes/dist/public"),
  path.resolve(process.cwd(), "artifacts/cloudnotes/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
];

for (const staticDir of candidatePaths) {
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        return res.sendFile(path.join(staticDir, "index.html"), (err) => {
          if (err) next();
        });
      }
      next();
    });
    break;
  }
}

export default app;

