import Queue from "../models/Queue.js";

// Create a new queue
export const createQueue = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Queue name is required",
      });
    }

    const newQueue = new Queue({
      name: name.trim(),
      description: description || "",
      manager: req.managerId,
    });

    const savedQueue = await newQueue.save();

    return res.status(201).json({
      message: "Queue created successfully",
      queue: savedQueue,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create queue",
      error: error.message,
    });
  }
};

// Get queues belonging to the logged-in manager
export const getQueues = async (req, res) => {
  try {
    const queues = await Queue.find({
      manager: req.managerId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: queues.length,
      queues,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch queues",
      error: error.message,
    });
  }
};
