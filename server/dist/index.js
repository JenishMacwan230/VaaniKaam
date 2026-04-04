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
dotenv_1.default.config({ path: node_path_1.default.resolve(__dirname, "../.env") });
const app = (0, express_1.default)();
const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use((0, cors_1.default)({ origin: clientOrigin, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({ message: "VaaniKaam API running (TS)" });
});
app.use("/api/users", users_1.default);
app.use("/api/jobs", jobs_1.default);
app.use("/api/admin", admin_1.default);
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
