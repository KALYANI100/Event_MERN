import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Event } from "./models/Event.js";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required");
    process.exit(1);
  }
  await connectDB();

  let admin = await User.findOne({ email });
  if (admin) {
    if (admin.role !== "admin") {
      admin.role = "admin";
      await admin.save();
      console.log("Updated user to admin:", email);
    } else {
      console.log("Admin already exists:", email);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await User.create({
      name: "Administrator",
      email,
      passwordHash,
      role: "admin",
    });
    console.log("Created admin user:", email);
  }

  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    const now = new Date();
    const sampleEvents = Array.from({ length: 10 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + (index + 1) * 3);
      return {
        title: `Sample Event ${index + 1}`,
        description: `This is a sample event description for Sample Event ${index + 1}. Join us for networking, learning, and fun!`,
        date,
        location: `Hall ${index + 1}, Sample Venue`,
        capacity: 100,
        createdBy: admin._id,
      };
    });
    await Event.insertMany(sampleEvents);
    console.log("Created 10 sample events.");
  } else {
    console.log(`Skipping sample events. ${eventCount} event(s) already exist.`);
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
