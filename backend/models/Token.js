import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },

    personName: {
      type: String,
      required: true,
      trim: true,
    },

    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },

    status: {
      type: String,
      enum: ["WAITING", "SERVING", "SERVED", "CANCELLED"],
      default: "WAITING",
    },

    position: {
      type: Number,
      default: 0,
    },

    servingAt: {
      type: Date,
      default: null,
    },

    servedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate token numbers within the same queue
tokenSchema.index({ queue: 1, tokenNumber: 1 }, { unique: true });

// Only one token can be SERVING in each queue
tokenSchema.index(
  { queue: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "SERVING" },
  },
);

const Token = mongoose.model("Token", tokenSchema);

export default Token;
