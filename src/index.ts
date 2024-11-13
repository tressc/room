import express, { Express, Request, Response } from "express";
import RedisStore from "connect-redis";
import session from "express-session";
import { createClient } from "redis";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import { comparePassword } from "@utils/password";

dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

let redisClient = createClient();
redisClient.connect().catch(console.error);

let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});

app.use(
  session({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "mysecret",
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authUser = async (username: string, password: string, done: Function) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return done(null, false, { message: "User not found" });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: "Incorrect password" });
    }
    return done(null, user);
  } catch (error) {
    return done(null, error);
  }
};

passport.use(new LocalStrategy(authUser));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (user: { id: number }, done) => {
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  return done(null, dbUser);
});

app.get("/", (req: Request, res: Response) => {
  res.send("Express Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
