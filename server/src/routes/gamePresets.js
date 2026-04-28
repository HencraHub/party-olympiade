import express from "express";
import jwt from "jsonwebtoken";
import GamePreset from "../models/GamePreset.js";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// GET /api/game-presets — list all presets, alphabetically
router.get("/", async (req, res) => {
  try {
    const presets = await GamePreset.find()
      .sort({ title: 1 })
      .select("-imageBase64") // skip large field in list view
      .lean();
    res.json(presets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/game-presets/:id — single preset (includes imageBase64)
router.get("/:id", async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id).lean();
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    res.json(preset);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/game-presets — create preset (auth required)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, mode, icon, rules, addons } = req.body;
    if (!title?.trim())
      return res.status(400).json({ error: "Title is required" });

    // Fetch username for denormalization
    const user = await User.findById(req.user.id).select("username").lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    const preset = await GamePreset.create({
      title: title.trim(),
      mode: mode || "ffa",
      icon: icon || "🎮",
      rules: rules || "",
      addons: addons || {},
      createdBy: req.user.id,
      createdByUsername: user.username,
    });

    res.status(201).json(preset);
  } catch (err) {
    console.error("create preset error:", err);
    res.status(500).json({ error: "Failed to create preset" });
  }
});

// PATCH /api/game-presets/:id — update own preset (auth required)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id);
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    if (String(preset.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Not your preset" });

    const { title, mode, icon, rules, addons } = req.body;
    if (title !== undefined) preset.title = title.trim();
    if (mode !== undefined) preset.mode = mode;
    if (icon !== undefined) preset.icon = icon || "🎮";
    if (rules !== undefined) preset.rules = rules;
    if (addons !== undefined) preset.addons = addons;

    await preset.save();
    res.json(preset);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/game-presets/:id — delete own preset (auth required)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id);
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    if (String(preset.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Not your preset" });

    await preset.deleteOne();
    res.json({ message: "Preset deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
