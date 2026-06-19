import mongoose from "mongoose";
// Importamos Category aquí para que Mongoose lo registre antes de hacer el populate
import "./Category"; 

const productSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;