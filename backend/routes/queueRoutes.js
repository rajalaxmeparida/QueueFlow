import express from "express";
import {
  createQueue,
  getQueues,
  updateQueue,
} from "../controllers/queueController.js";

const router = express.Router();

// Create a queue
router.post("/", createQueue);

// Get all queues
router.get("/", getQueues);

// Update a queue
router.patch("/:queueId", updateQueue);

export default router;
