import { Router } from "express";
import { sendContactMessage } from "../controllers/contactController";

const router = Router();

router.post("/send", sendContactMessage);

export default router;
