'use server'

import connectDB from "../../lib/mongodb";
import Category from "../../models/Category";
import Product from "../../models/Product";
import { revalidatePath } from "next/cache";

const parse = (obj) => JSON.parse(JSON.stringify(obj));

// --- ACCIONES PARA CATEGORÍAS ---
export async function getCategories() {
  await connectDB();
  const categories = await Category.find({ active: true }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function createCategory(formData) {
  await connectDB();
  const name = formData.get("name");
  await Category.create({ name });
  revalidatePath("/admin/categorias"); // Limpia la caché para mostrar la nueva categoría
}

export async function deleteCategory(id) {
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath("/admin/categorias");
}

export async function toggleCategoryStatus(id, currentStatus) {
  await connectDB();
  await Category.findByIdAndUpdate(id, { active: !currentStatus });
  revalidatePath("/admin/categorias");
}

export async function updateCategory(id, newName) {
  await connectDB();
  await Category.findByIdAndUpdate(id, { name: newName });
  revalidatePath("/admin/categorias");
}

// --- ACCIONES PARA PRODUCTOS ---
export async function getProducts() {
  await connectDB();
  const products = await Product.find({})
    .sort({ createdAt: -1 }) // Los más nuevos primero
    .populate("category")
    .lean();
  return parse(products);
}

export async function saveProduct(formData, id = null) {
  await connectDB();

  const data = {
    code: formData.get("code"),
    name: formData.get("name"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    category: formData.get("category"),
    active: formData.get("active") === "true"
  };

  if (id) {
    await Product.findByIdAndUpdate(id, data);
  } else {
    await Product.create(data);
  }

  revalidatePath("/admin/productos");
}

export async function deleteProduct(id) {
  await connectDB();
  await Product.findByIdAndDelete(id);
  revalidatePath("/admin/productos");
}

export async function addStock(id, quantity) {
  await connectDB();
  // Usamos $inc de MongoDB para evitar problemas de concurrencia
  await Product.findByIdAndUpdate(id, { $inc: { stock: quantity } });
  revalidatePath("/admin/productos");
}