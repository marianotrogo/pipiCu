import dbConnect from '../../../lib/mongodb';
import Turno from '../../../models/Turno';
import PanelReportes from './PanelReportes'; 

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  await dbConnect();

  // Buscamos primero si hay un turno abierto actualmente
  let currentTurno = await Turno.findOne({ estado: 'ABIERTO' }).lean();

  // Si no hay un turno abierto, traemos el último turno cerrado como referencia
  if (!currentTurno) {
    currentTurno = await Turno.findOne().sort({ createdAt: -1 }).lean();
  }

  // Serialización limpia para evitar errores con ObjectIds y fechas de MongoDB
  const turnoData = currentTurno ? {
    _id: currentTurno._id.toString(),
    tipo: currentTurno.tipo || 'MAÑANA',
    estado: currentTurno.estado || 'CERRADO',
    montoApertura: currentTurno.montoApertura || 0,
    montoCierre: currentTurno.montoCierre || 0,
    abiertoPor: currentTurno.abiertoPor || 'Sistema',
    abiertoEn: currentTurno.abiertoEn instanceof Date ? currentTurno.abiertoEn.toISOString() : null,
    cerradoEn: currentTurno.cerradoEn instanceof Date ? currentTurno.cerradoEn.toISOString() : null,
    createdAt: currentTurno.createdAt instanceof Date ? currentTurno.createdAt.toISOString() : null,
    updatedAt: currentTurno.updatedAt instanceof Date ? currentTurno.updatedAt.toISOString() : null,
  } : null;

  return (
    <PanelReportes initialTurno={turnoData} />
  );
}