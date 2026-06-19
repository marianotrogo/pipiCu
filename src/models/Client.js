import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dni: { type: String },
    email: { type: String },
    phone: { type: String },
    credit: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
}, { timestamps: true });

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

// IMPORTANTE: mongoose.models.Client evita errores de re-compilación en Next.js
export default Client;