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

// Update an existing queue
export const updateQueue = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Queue name cannot be empty",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "Invalid queue description",
        });
      }

      updates.description = description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid updates provided",
      });
    }

    const updatedQueue = await Queue.findOneAndUpdate(
      {
        _id: req.params.queueId,
        manager: req.managerId,
      },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!updatedQueue) {
      return res.status(404).json({
        message: "Queue not found",
      });
    }

    return res.status(200).json({
      message: "Queue updated successfully",
      queue: updatedQueue,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update queue",
      error: error.message,
    });
  }
};
