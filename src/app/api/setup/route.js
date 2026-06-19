import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  await connectDB();
  
  // Hash de la contraseña
  const hashed = await bcrypt.hash("admin123", 10);
  
  try {
    const user = await User.findOneAndUpdate(
      { email: "admin@test.com" },
      { 
        name: "Admin Demo", 
        passwordHash: hashed, 
        role: "ADMIN",
        active: true 
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ message: "Usuario listo", user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}