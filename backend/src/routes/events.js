import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public / user: list upcoming events
router.get("/", async (_req, res) => {
  const events = await Event.find({ date: { $gte: new Date() } })
    .sort({ date: 1 })
    .populate("createdBy", "name email")
    .lean();
  const ids = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: ids } } },
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(
    events.map((e) => ({
      ...e,
      registrationCount: countMap[String(e._id)] || 0,
      spotsLeft:
        e.capacity != null
          ? Math.max(0, e.capacity - (countMap[String(e._id)] || 0))
          : null,
    }))
  );
});

// Admin: list all events (including past)
router.get("/admin/all", requireAuth, requireAdmin, async (_req, res) => {
  const events = await Event.find()
    .sort({ date: -1 })
    .populate("createdBy", "name email")
    .lean();
  const ids = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: ids } } },
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(
    events.map((e) => ({
      ...e,
      registrationCount: countMap[String(e._id)] || 0,
    }))
  );
});

router.get("/:id", param("id").isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid event id" });
  }
  const event = await Event.findById(req.params.id).populate("createdBy", "name email");
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }
  const registrationCount = await Registration.countDocuments({ event: event._id });
  const spotsLeft =
    event.capacity != null ? Math.max(0, event.capacity - registrationCount) : null;
  const obj = event.toObject();
  res.json({
    ...obj,
    registrationCount,
    spotsLeft,
  });
});

router.post(
  "/",
  requireAuth,
  requireAdmin,
  [
    body("title").trim().notEmpty(),
    body("description").optional().isString(),
    body("date").isISO8601().toDate(),
    body("location").trim().notEmpty(),
    body("capacity").optional({ nullable: true }).isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { title, description = "", date, location, capacity } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity: capacity ?? null,
      createdBy: req.userId,
    });
    res.status(201).json(event);
  }
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  param("id").isMongoId(),
  [
    body("title").optional().trim().notEmpty(),
    body("description").optional().isString(),
    body("date").optional().isISO8601().toDate(),
    body("location").optional().trim().notEmpty(),
    body("capacity").optional({ nullable: true }).isInt({ min: 1 }),
  ],
  async (req, res) => {
    const ve = validationResult(req);
    if (!ve.isEmpty()) {
      return res.status(400).json({ message: ve.array()[0].msg });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const { title, description, date, location, capacity } = req.body;
    if (title != null) event.title = title;
    if (description != null) event.description = description;
    if (date != null) event.date = date;
    if (location != null) event.location = location;
    if (capacity !== undefined) event.capacity = capacity;
    await event.save();
    res.json(event);
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  param("id").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid event id" });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const event = await Event.findById(req.params.id).session(session);
      if (!event) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Event not found" });
      }
      await Registration.deleteMany({ event: event._id }).session(session);
      await Event.deleteOne({ _id: event._id }).session(session);
      await session.commitTransaction();
      res.json({ message: "Event deleted" });
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
);

export default router;
