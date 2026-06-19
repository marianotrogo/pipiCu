import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'CAJERO'], default: 'CAJERO' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

// Esto evita que Next.js intente recrear el modelo cada vez que guardas un cambio
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;