import express from "express";
import {
  getQueueAnalytics,
  getOverallAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/overview", getOverallAnalytics);

router.get("/queue/:queueId", getQueueAnalytics);

export default router;
