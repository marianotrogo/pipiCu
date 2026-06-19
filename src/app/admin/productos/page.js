import { getProducts, getCategories } from "../../../app/actions/inventory";
import ProductTableClient from "../../../components/ProductTableClient";

export default async function ProductosPage() {
  // Traemos los datos una sola vez en el servidor
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Pasamos todo al componente de cliente */}
      <ProductTableClient initialProducts={products} categories={categories} />
    </div>
  );
}