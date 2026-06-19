import mongoose from 'mongoose';

const TurnoSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['MAÑANA', 'NOCHE'], required: true },
  estado: { type: String, enum: ['ABIERTO', 'CERRADO'], default: 'ABIERTO' },
  montoApertura: { type: Number, default: 0 },
  montoCierre: { type: Number, default: 0 },
  abiertoEn: { type: Date, default: Date.now },
  cerradoEn: { type: Date },
  abiertoPor: { type: String }, // ID o Nombre del usuario
}, { timestamps: true });

export default mongoose.models.Turno || mongoose.model('Turno', TurnoSchema);