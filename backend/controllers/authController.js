import Manager from "../models/Manager.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Manager registration
export const registerManager = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    const existingManager = await Manager.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingManager) {
      return res.status(409).json({
        message: "Manager with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await Manager.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Manager registered successfully",
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Manager login
export const loginManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const manager = await Manager.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!manager) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ id: manager._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};
