'use server'
import connectDB from "../../lib/mongodb";
import User from "../../models/User";
import bcrypt from "bcryptjs";

export async function registerUser(formData) {
  const { name, email, password, role } = formData;
  await connectDB();

  const exist = await User.findOne({ email });
  if (exist) return { error: "El usuario ya existe" };

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role });

  return { success: true };
}