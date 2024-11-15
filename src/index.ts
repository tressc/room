import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import { comparePassword, encryptPassword } from "@utils/password";

dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
  session({
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
      console.log("no user");
      return done(null, false, { message: "User not found" });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      console.log("incorrect pw");
      return done(null, false, { message: "Incorrect password" });
    }
    console.log("pw match!");
    return done(null, user);
  } catch (error) {
    console.log("error");
    return done(null, error);
  }
};

passport.use(new LocalStrategy(authUser));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  console.log("serializing");
  try {
    return done(null, user.id);
  } catch (err) {
    console.log("serialize error:", err);
  }
});

passport.deserializeUser(async (id: number, done) => {
  console.log("deserializing");

  try {
    const user = await prisma.user.findFirst({ where: { id } });
    console.log(user);
    return done(null, user);
  } catch (err) {
    console.log("deserialize error:", err);
  }
});

const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
  return req.isAuthenticated() ? next() : res.redirect(301, "/login");
};

const ensureUnAuth = (req: Request, res: Response, next: NextFunction) => {
  return !req.isAuthenticated() ? next() : res.redirect(301, "/protected");
};

app.get("/", (req: Request, res: Response) => {
  res.send("Express Server");
});

app.get("/protected", ensureAuth, (req: Request, res: Response) => {
  res.send("secure!");
});

app.get("/login", ensureUnAuth, (req: Request, res: Response) => {
  res.render("login.ejs");
});

app.post("/login", (req: Request, res: Response) => {
  passport.authenticate("local", {
    successRedirect: "/protected",
    failureRedirect: "/login",
  })(req, res);
});

app.get("/signup", (req: Request, res: Response) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const encryptedPassword = await encryptPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: encryptedPassword,
      },
    });
    res.redirect(302, "/login");
  } catch (err) {
    console.log(err);
    res.redirect(302, "/signup");
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
