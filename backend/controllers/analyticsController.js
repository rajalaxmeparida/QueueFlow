import Queue from "../models/Queue.js";
import Token from "../models/Token.js";

// Format dates using the local calendar date
const getLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getQueueAnalytics = async (req, res) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findById(queueId);

    if (!queue) {
      return res.status(404).json({
        message: "Queue not found",
      });
    }

    // Count tokens by status
    const [totalTokens, waiting, serving, served, cancelled] =
      await Promise.all([
        Token.countDocuments({ queue: queueId }),
        Token.countDocuments({ queue: queueId, status: "WAITING" }),
        Token.countDocuments({ queue: queueId, status: "SERVING" }),
        Token.countDocuments({ queue: queueId, status: "SERVED" }),
        Token.countDocuments({ queue: queueId, status: "CANCELLED" }),
      ]);

    // Calculate average waiting time in minutes
    const waitingResult = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          servingAt: { $ne: null },
        },
      },
      {
        $project: {
          duration: { $subtract: ["$servingAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$duration" },
        },
      },
    ]);

    // Calculate average service time in minutes
    const serviceResult = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          status: "SERVED",
          servingAt: { $ne: null },
          servedAt: { $ne: null },
        },
      },
      {
        $project: {
          duration: { $subtract: ["$servedAt", "$servingAt"] },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$duration" },
        },
      },
    ]);

    // Build daily queue-length trends for the last 7 days
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const tokens = await Token.find({ queue: queue._id })
      .select("createdAt servingAt cancelledAt")
      .lean();

    // Calculate how many tokens were waiting at the start
    let waitingAtStart = 0;

    const dailyChanges = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const key = getLocalDateKey(date);
      dailyChanges[key] = 0;
    }

    tokens.forEach((token) => {
      const created = new Date(token.createdAt);
      const serving = token.servingAt ? new Date(token.servingAt) : null;
      const cancelledAt = token.cancelledAt
        ? new Date(token.cancelledAt)
        : null;

      const leavesQueue = serving || cancelledAt;

      if (created < startDate) {
        if (!leavesQueue || leavesQueue >= startDate) {
          waitingAtStart++;
        }
      } else {
        const createdKey = getLocalDateKey(created);

        if (dailyChanges[createdKey] !== undefined) {
          dailyChanges[createdKey]++;
        }
      }

      if (serving && serving >= startDate) {
        const key = getLocalDateKey(serving);

        if (dailyChanges[key] !== undefined) {
          dailyChanges[key]--;
        }
      }

      if (cancelledAt && cancelledAt >= startDate) {
        const key = getLocalDateKey(cancelledAt);

        if (dailyChanges[key] !== undefined) {
          dailyChanges[key]--;
        }
      }
    });

    let currentWaiting = waitingAtStart;

    const dailyTrends = Object.entries(dailyChanges).map(([date, change]) => {
      currentWaiting += change;

      return {
        date,
        waitingTokens: currentWaiting,
      };
    });

    return res.status(200).json({
      message: "Queue analytics fetched successfully",
      queue: {
        id: queue._id,
        name: queue.name,
      },
      summary: {
        totalTokens,
        waiting,
        serving,
        served,
        cancelled,
      },
      averageWaitingTimeMinutes: Number(
        ((waitingResult[0]?.average || 0) / 60000).toFixed(2),
      ),
      averageServiceTimeMinutes: Number(
        ((serviceResult[0]?.average || 0) / 60000).toFixed(2),
      ),
      dailyTrends,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch queue analytics",
      error: error.message,
    });
  }
};

export const getOverallAnalytics = async (req, res) => {
  try {
    // Get only queues owned by the logged-in manager
    const queues = await Queue.find({
      manager: req.managerId,
    }).select("_id name isActive");

    const queueIds = queues.map((queue) => queue._id);

    // Calculate token counts across all owned queues
    const [totalTokens, waiting, serving, served, cancelled] =
      await Promise.all([
        Token.countDocuments({ queue: { $in: queueIds } }),
        Token.countDocuments({
          queue: { $in: queueIds },
          status: "WAITING",
        }),
        Token.countDocuments({
          queue: { $in: queueIds },
          status: "SERVING",
        }),
        Token.countDocuments({
          queue: { $in: queueIds },
          status: "SERVED",
        }),
        Token.countDocuments({
          queue: { $in: queueIds },
          status: "CANCELLED",
        }),
      ]);

    // Calculate overall average waiting time
    const waitingResult = await Token.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          servingAt: { $ne: null },
        },
      },
      {
        $project: {
          duration: { $subtract: ["$servingAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$duration" },
        },
      },
    ]);

    // Calculate overall average service time
    const serviceResult = await Token.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          status: "SERVED",
          servingAt: { $ne: null },
          servedAt: { $ne: null },
        },
      },
      {
        $project: {
          duration: { $subtract: ["$servedAt", "$servingAt"] },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$duration" },
        },
      },
    ]);

    // Build seven-day queue-length trends
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const allTokens = await Token.find({
      queue: { $in: queueIds },
    })
      .select("createdAt servingAt cancelledAt")
      .lean();

    let waitingAtStart = 0;
    const dailyChanges = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      dailyChanges[getLocalDateKey(date)] = 0;
    }

    allTokens.forEach((token) => {
      const created = new Date(token.createdAt);
      const servingDate = token.servingAt ? new Date(token.servingAt) : null;
      const cancelledDate = token.cancelledAt
        ? new Date(token.cancelledAt)
        : null;

      const leavesQueue = servingDate || cancelledDate;

      if (created < startDate) {
        if (!leavesQueue || leavesQueue >= startDate) {
          waitingAtStart++;
        }
      } else {
        const key = getLocalDateKey(created);

        if (dailyChanges[key] !== undefined) {
          dailyChanges[key]++;
        }
      }

      if (servingDate && servingDate >= startDate) {
        const key = getLocalDateKey(servingDate);

        if (dailyChanges[key] !== undefined) {
          dailyChanges[key]--;
        }
      }

      if (cancelledDate && cancelledDate >= startDate) {
        const key = getLocalDateKey(cancelledDate);

        if (dailyChanges[key] !== undefined) {
          dailyChanges[key]--;
        }
      }
    });

    let currentWaiting = waitingAtStart;

    const dailyTrends = Object.entries(dailyChanges).map(([date, change]) => {
      currentWaiting += change;

      return {
        date,
        waitingTokens: currentWaiting,
      };
    });

    return res.status(200).json({
      message: "Overall analytics fetched successfully",

      summary: {
        totalQueues: queues.length,
        activeQueues: queues.filter((queue) => queue.isActive).length,
        totalTokens,
        waiting,
        serving,
        served,
        cancelled,
      },

      averageWaitingTimeMinutes: Number(
        ((waitingResult[0]?.average || 0) / 60000).toFixed(2),
      ),

      averageServiceTimeMinutes: Number(
        ((serviceResult[0]?.average || 0) / 60000).toFixed(2),
      ),

      dailyTrends,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch overall analytics",
      error: error.message,
    });
  }
};
