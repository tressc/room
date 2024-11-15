"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const express_session_1 = __importDefault(require("express-session"));
const redis_1 = require("redis");
const passport_1 = __importDefault(require("passport"));
const client_1 = require("@prisma/client");
const passport_local_1 = require("passport-local");
const dotenv_1 = __importDefault(require("dotenv"));
const password_1 = require("@utils/password");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
let redisClient = (0, redis_1.createClient)({ legacyMode: true });
redisClient.connect().catch(console.error);
let redisStore = new connect_redis_1.default({
    client: redisClient,
    prefix: "myapp:",
});
app.use((0, express_session_1.default)({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "mysecret",
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
const authUser = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { username } });
        if (!user) {
            console.log("no user");
            return done(null, false, { message: "User not found" });
        }
        const isMatch = yield (0, password_1.comparePassword)(password, user.password);
        if (!isMatch) {
            console.log("incorrect pw");
            return done(null, false, { message: "Incorrect password" });
        }
        console.log("pw match!");
        return done(null, user);
    }
    catch (error) {
        console.log("error");
        return done(null, error);
    }
});
passport_1.default.use(new passport_local_1.Strategy(authUser));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
passport_1.default.serializeUser((user, done) => {
    console.log("serializing");
    try {
        return done(null, user.id);
    }
    catch (err) {
        console.log("serialize error:", err);
    }
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("deserializing");
    try {
        const user = yield prisma.user.findFirst({ where: { id } });
        console.log(user);
        return done(null, user);
    }
    catch (err) {
        console.log("deserialize error:", err);
    }
}));
const ensureAuth = (req, res, next) => {
    console.log(req.isAuthenticated());
    return req.isAuthenticated() ? next() : res.redirect(301, "/login");
};
app.get("/", (req, res) => {
    res.send("Express Server");
});
app.get("/protected", ensureAuth, (req, res) => {
    res.send("secure!");
});
app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.post("/login", (req, res) => {
    // console.log(req, res, next);
    passport_1.default.authenticate("local", {
        successRedirect: "/protected",
        failureRedirect: "/login",
    })(req, res);
});
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const encryptedPassword = yield (0, password_1.encryptPassword)(req.body.password);
        const user = yield prisma.user.create({
            data: Object.assign(Object.assign({}, req.body), { password: encryptedPassword }),
        });
        res.redirect(302, "/login");
    }
    catch (err) {
        console.log(err);
        res.redirect(302, "/signup");
    }
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
