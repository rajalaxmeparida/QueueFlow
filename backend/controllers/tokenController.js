import Queue from "../models/Queue.js";
import Token from "../models/Token.js";

// Add a person to a manager's queue
export const addToken = async (req, res) => {
  try {
    const { personName, queueId } = req.body;

    if (!personName?.trim() || !queueId) {
      return res.status(400).json({
        message: "Person name and queue ID are required",
      });
    }

    const queue = await Queue.findOneAndUpdate(
      { _id: queueId, manager: req.managerId, isActive: true },
      { $inc: { lastTokenNumber: 1 } },
      { returnDocument: "after" },
    );

    if (!queue) {
      return res.status(404).json({
        message: "Queue not found or inactive",
      });
    }

    const newToken = new Token({
      tokenNumber: queue.lastTokenNumber,
      personName: personName.trim(),
      queue: queue._id,
      status: "WAITING",
      position: queue.lastTokenNumber,
    });

    const savedToken = await newToken.save();

    return res.status(201).json({
      message: "Token created successfully",
      token: savedToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create token",
      error: error.message,
    });
  }
};

// Get waiting tokens
export const getWaitingTokens = async (req, res) => {
  try {
    const queue = await Queue.findOne({
      _id: req.params.queueId,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    const tokens = await Token.find({
      queue: queue._id,
      status: "WAITING",
    }).sort({ position: 1, createdAt: 1 });

    return res.status(200).json({
      count: tokens.length,
      tokens,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch waiting tokens",
      error: error.message,
    });
  }
};

// Move a waiting token
export const moveToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { direction } = req.body;

    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({
        message: "Direction must be either up or down",
      });
    }

    const currentToken = await Token.findById(tokenId);

    if (!currentToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    const queue = await Queue.findOne({
      _id: currentToken.queue,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (currentToken.status !== "WAITING") {
      return res.status(400).json({
        message: "Only waiting tokens can be moved",
      });
    }

    const adjacentToken = await Token.findOne({
      queue: currentToken.queue,
      status: "WAITING",
      position:
        direction === "up"
          ? { $lt: currentToken.position }
          : { $gt: currentToken.position },
    }).sort({ position: direction === "up" ? -1 : 1 });

    if (!adjacentToken) {
      return res.status(400).json({
        message:
          direction === "up"
            ? "Token is already at the top"
            : "Token is already at the bottom",
      });
    }

    const currentPosition = currentToken.position;

    await Token.bulkWrite([
      {
        updateOne: {
          filter: { _id: currentToken._id },
          update: { $set: { position: adjacentToken.position } },
        },
      },
      {
        updateOne: {
          filter: { _id: adjacentToken._id },
          update: { $set: { position: currentPosition } },
        },
      },
    ]);

    return res.status(200).json({
      message: `Token moved ${direction} successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to move token",
      error: error.message,
    });
  }
};

// Cancel a waiting token
export const cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.tokenId);

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    const queue = await Queue.findOne({
      _id: token.queue,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (token.status !== "WAITING") {
      return res.status(400).json({
        message: "Only waiting tokens can be cancelled",
      });
    }

    token.status = "CANCELLED";
    token.cancelledAt = new Date();
    await token.save();

    return res.status(200).json({
      message: "Token cancelled successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel token",
      error: error.message,
    });
  }
};

// Call the next waiting token
export const callNextToken = async (req, res) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findOne({
      _id: queueId,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    const servingToken = await Token.findOne({
      queue: queueId,
      status: "SERVING",
    });

    if (servingToken) {
      return res.status(409).json({
        message: "A token is already being served",
        token: servingToken,
      });
    }

    const nextToken = await Token.findOneAndUpdate(
      { queue: queueId, status: "WAITING" },
      {
        $set: {
          status: "SERVING",
          servingAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        sort: { position: 1, createdAt: 1 },
      },
    );

    if (!nextToken) {
      return res.status(404).json({
        message: "No waiting tokens in this queue",
      });
    }

    return res.status(200).json({
      message: "Next token called successfully",
      token: nextToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to call next token",
      error: error.message,
    });
  }
};

// Mark a serving token as served
export const markTokenServed = async (req, res) => {
  try {
    const token = await Token.findById(req.params.tokenId);

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    const queue = await Queue.findOne({
      _id: token.queue,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (token.status !== "SERVING") {
      return res.status(400).json({
        message: "Only tokens currently being served can be marked as served",
      });
    }

    token.status = "SERVED";
    token.servedAt = new Date();
    await token.save();

    return res.status(200).json({
      message: "Token marked as served successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to mark token as served",
      error: error.message,
    });
  }
};

// Get the currently serving token
export const getServingToken = async (req, res) => {
  try {
    const queue = await Queue.findOne({
      _id: req.params.queueId,
      manager: req.managerId,
    });

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    const servingToken = await Token.findOne({
      queue: queue._id,
      status: "SERVING",
    });

    return res.status(200).json({
      token: servingToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch serving token",
      error: error.message,
    });
  }
};
