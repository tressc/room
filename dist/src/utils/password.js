"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.encryptPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const encryptPassword = (password) => {
    return bcrypt_1.default.hash(password, 10);
};
exports.encryptPassword = encryptPassword;
const comparePassword = (plain, hashed) => {
    return bcrypt_1.default.compare(plain, hashed);
};
exports.comparePassword = comparePassword;
