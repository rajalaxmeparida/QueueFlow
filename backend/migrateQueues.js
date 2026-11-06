import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Manager from "./models/Manager.js";
import Queue from "./models/Queue.js";

const migrateQueues = async () => {
  try {
    await connectDB();

    const manager = await Manager.findOne({
      email: "manager@queueflow.com",
    });

    if (!manager) {
      throw new Error("Existing manager account not found.");
    }

    const result = await Queue.updateMany(
      {
        manager: { $exists: false },
      },
      {
        $set: { manager: manager._id },
      },
    );

    console.log("Queue migration completed.");
    console.log("Queues assigned:", result.modifiedCount);
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

migrateQueues();
