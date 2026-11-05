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
    });

    const savedQueue = await newQueue.save();

    res.status(201).json({
      message: "Queue created successfully",
      queue: savedQueue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create queue",
      error: error.message,
    });
  }
};

// Get all queues
export const getQueues = async (req, res) => {
  try {
    const queues = await Queue.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: queues.length,
      queues,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch queues",
      error: error.message,
    });
  }
};
