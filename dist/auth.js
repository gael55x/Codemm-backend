"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./database");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 10);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function generateToken(userId, username, email) {
    return jsonwebtoken_1.default.sign({ id: userId, username, email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
}
// Middleware to protect routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
    // Verify user still exists
    const user = database_1.userDb.findById(payload.id);
    if (!user) {
        return res.status(403).json({ error: "User not found" });
    }
    req.user = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
    };
    next();
}
// Optional auth middleware - adds user info if token present but doesn't require it
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            const user = database_1.userDb.findById(payload.id);
            if (user) {
                req.user = {
                    id: payload.id,
                    username: payload.username,
                    email: payload.email,
                };
            }
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map