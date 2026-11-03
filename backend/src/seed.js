import dotenv from "dotenv";
import mongoose from "mongoose";
import {User}  from "./models/user.models.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "tarik2@example.com";
  const existing = await User.findOne({ email });

  if (existing) {
    console.log("User already exists:", existing.email);
  } else {
    await User.create({
      email,
      username: "tarik3",
      password: "Test@1234",   // hashed by your model's pre-save hook
      role: "admin",
      fullName: "Tarik Khan",
      isEmailVerified: true,   // skips email verification
    });
    console.log("User created");
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});