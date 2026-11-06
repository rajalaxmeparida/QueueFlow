import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastTokenNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;
