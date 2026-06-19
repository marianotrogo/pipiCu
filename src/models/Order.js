import mongoose from "mongoose";

// Sub-schema de items
const itemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    qty: Number,
    total: Number
}, { _id: false });

// Sub-schema de pagos
const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    method: { 
        type: String, 
        enum: ['EFECTIVO', 'CREDITO', 'TRANSFERENCIA', 'QR', 'CUENTA_CORRIENTE', 'PAGOS_CUENTA_CORRIENTE'], 
        required: true 
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    number: { type: String, unique: true },
    table: { type: String },
    address: { type: String },
    customerName: { type: String },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    items: [itemSchema],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    total: Number,
    payments: [paymentSchema],
    status: {
        type: String,
        enum: ['PROCESO', 'ENVIADO', 'COBRADO', 'CANCELADO', 'CUENTA_CORRIENTE'],
        default: 'PROCESO'
    },
    paidAt: { type: Date }, 
    cadete: { type: String, default: "" },   
    cancelReason: { type: String, default: '' },
    canceledAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// EL AJUSTE PARA NEXT.JS:
export default mongoose.models.Order || mongoose.model('Order', orderSchema);