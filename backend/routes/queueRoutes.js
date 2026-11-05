import express from "express";
import { createQueue, getQueues } from "../controllers/queueController.js";

const router = express.Router();

// Create a queue
router.post("/", createQueue);

// Get all queues
router.get("/", getQueues);

export default router;
