'use client'
import { useState, useMemo } from 'react';
import Link from "next/link";
import ProductModal from "./ProductModal";
import StockUpdateModal from "./StockUpdateModal";
import { deleteProduct } from "../app/actions/inventory";

export default function ProductTableClient({ initialProducts, categories }) {
  const [query, setQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: 'name', order: 'asc' });

  // Lógica de filtrado y ordenamiento instantáneo
  const filteredAndSortedProducts = useMemo(() => {
    let result = initialProducts.filter(p => 
      p.name?.toLowerCase().includes(query.toLowerCase()) || 
      p.code?.toLowerCase().includes(query.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = a[sortConfig.field] ?? "";
      let valB = b[sortConfig.field] ?? "";
      
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [initialProducts, query, sortConfig]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortArrow = ({ field }) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.order === 'asc' ? " ↑" : " ↓";
  };

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold uppercase text-black">Inventario</h1>
          <ProductModal categories={categories} />
        </div>
        
        {/* Buscador local instantáneo */}
        <input
          type="text"
          placeholder="Buscar producto o código..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-64 border border-black px-2 py-1 text-[12px] outline-none focus:bg-gray-50"
        />
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-300">
  <table className="w-full border-collapse text-[12px] bg-white text-black">
    <thead>
      <tr className="bg-gray-100 uppercase sticky top-0 z-10 shadow-sm">
        <th onClick={() => handleSort('code')} className="border border-gray-300 px-2 py-1.5 text-left w-24 cursor-pointer hover:bg-gray-200">
          Código<SortArrow field="code" />
        </th>
        <th onClick={() => handleSort('name')} className="border border-gray-300 px-2 py-1.5 text-left cursor-pointer hover:bg-gray-200">
          Producto<SortArrow field="name" />
        </th>
        <th className="border border-gray-300 px-2 py-1.5 text-left w-32 text-gray-500">Categoría</th>
        <th onClick={() => handleSort('stock')} className="border border-gray-300 px-2 py-1.5 text-center w-20 cursor-pointer hover:bg-gray-200">
          Stock<SortArrow field="stock" />
        </th>
        <th onClick={() => handleSort('price')} className="border border-gray-300 px-2 py-1.5 text-right w-24 cursor-pointer hover:bg-gray-200">
          Precio<SortArrow field="price" />
        </th>
        <th className="border border-gray-300 px-2 py-1.5 text-center w-32 text-gray-500 font-normal">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {filteredAndSortedProducts.map((p) => (
        <tr key={p._id} className="hover:bg-gray-50 transition-colors">
          <td className="border border-gray-300 px-2 py-1 font-mono text-gray-500">{p.code || '---'}</td>
          <td className="border border-gray-300 px-2 py-1 font-medium">{p.name}</td>
          <td className="border border-gray-300 px-2 py-1 text-gray-500">{p.category?.name || '-'}</td>
          <td className={`border border-gray-300 px-2 py-1 text-center font-bold ${p.stock === 0 ? 'text-red-600' : 'text-black'}`}>
            {p.stock}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-right font-bold">
            ${p.price?.toLocaleString()}
          </td>
          <td className="border border-gray-300 px-1 py-1">
            <div className="flex justify-center items-center gap-3">
              <StockUpdateModal product={p} />
              <ProductModal product={p} categories={categories} />
              <form action={async () => { await deleteProduct(p._id); }}>
                <button className="text-[10px] text-red-600 hover:underline uppercase font-bold">Eliminar</button>
              </form>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}