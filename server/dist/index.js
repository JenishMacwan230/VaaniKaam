"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const db_1 = __importDefault(require("./config/db"));
const firebase_1 = require("./config/firebase");
const users_1 = __importDefault(require("./routes/users"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const admin_1 = __importDefault(require("./routes/admin"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const contact_1 = __importDefault(require("./routes/contact"));
dotenv_1.default.config({ path: node_path_1.default.resolve(__dirname, "../.env") });
const app = (0, express_1.default)();
const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vaanikaam.vercel.app",
    // Support any *.vercel.app preview deployments
    ...(process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((u) => u.trim())
        : []),
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) ||
            /^https:\/\/vaanikaam(-[a-z0-9]+)?\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({ message: "VaaniKaam API running (TS)" });
});
app.use("/api/users", users_1.default);
app.use("/api/jobs", jobs_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/notifications", notifications_1.default);
app.use("/api/contact", contact_1.default);
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
const startServer = async () => {
    try {
        // Initialize Firebase
        (0, firebase_1.initializeFirebase)();
        await (0, db_1.default)();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    }
    catch (error) {
        console.error("Failed to start server", error);
        // do not exit so developer can still use other parts
    }
};
startServer();
