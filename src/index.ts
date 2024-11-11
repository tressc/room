import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import log from "@utils/logger";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + lalala Server");
});

app.listen(port, () => {
  console.log(log());
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
