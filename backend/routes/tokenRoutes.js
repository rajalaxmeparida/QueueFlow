import express from "express";
import {
  addToken,
  getWaitingTokens,
  moveToken,
  cancelToken,
  callNextToken,
  markTokenServed,
  getServingToken,
} from "../controllers/tokenController.js";

const router = express.Router();

router.post("/", addToken);

router.get("/queue/:queueId", getWaitingTokens);

router.patch("/:tokenId/move", moveToken);

router.patch("/:tokenId/cancel", cancelToken);

router.patch("/queue/:queueId/call-next", callNextToken);

router.patch("/:tokenId/serve", markTokenServed);

router.get("/queue/:queueId/serving", getServingToken);

export default router;
