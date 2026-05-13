import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  [
    body("eventId").isMongoId(),
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("phone").trim().notEmpty(),
    body("notes").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { eventId, fullName, email, phone, notes = "" } = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.date < new Date()) {
      return res.status(400).json({ message: "This event has already ended" });
    }
    const count = await Registration.countDocuments({ event: event._id });
    if (event.capacity != null && count >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }
    try {
      const reg = await Registration.create({
        event: eventId,
        user: req.userId,
        fullName,
        email,
        phone,
        notes,
      });
      res.status(201).json(reg);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }
      throw e;
    }
  }
);

// User: my registrations
router.get("/mine", requireAuth, async (req, res) => {
  const list = await Registration.find({ user: req.userId })
    .populate("event")
    .sort({ createdAt: -1 })
    .lean();
  res.json(list);
});

// Admin: all registrations for an event
router.get(
  "/event/:eventId",
  requireAuth,
  requireAdmin,
  param("eventId").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid event id" });
    }
    const regs = await Registration.find({ event: req.params.eventId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(regs);
  }
);

router.delete(
  "/:id",
  requireAuth,
  param("id").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid registration id" });
    }
    const registration = await Registration.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    await registration.deleteOne();
    res.json({ message: "Registration canceled" });
  }
);

export default router;
