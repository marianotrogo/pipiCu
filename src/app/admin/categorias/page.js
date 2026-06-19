import { getCategories, createCategory, deleteCategory, toggleCategoryStatus } from "../../../app/actions/inventory";
import EditCategoryModal from "../../../components/EditCategoryModal";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER RESPONSIVO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Categorías</h1>
            <p className="text-slate-500 text-sm">Gestiona las secciones de tu menú</p>
          </div>
          
          {/* FORMULARIO DE CREACIÓN */}
          <form action={createCategory} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <input 
              name="name"
              placeholder="Nombre de categoría..."
              className="px-4 py-2 outline-none text-slate-700 flex-1 min-w-[200px]"
              required
            />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold transition-all active:scale-95">
              + Crear
            </button>
          </form>
        </div>

        {/* CONTENEDOR DE LISTADO */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* VISTA DESKTOP (TABLA) - Se oculta en móviles */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 font-semibold text-slate-600 text-xs uppercase">Nombre</th>
                  <th className="p-5 font-semibold text-slate-600 text-xs uppercase">Estado</th>
                  <th className="p-5 font-semibold text-slate-600 text-xs uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-slate-700 font-medium">{cat.name}</td>
                    <td className="p-5">
                      <StatusBadge active={cat.active} id={cat._id} />
                    </td>
                    <td className="p-5 text-right flex justify-end gap-2">
                      <EditCategoryModal category={cat} />
                      <DeleteButton id={cat._id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA MOBILE (CARDS) - Se muestra solo en móviles */}
          <div className="md:hidden divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat._id} className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre</p>
                    <p className="text-lg font-bold text-slate-800">{cat.name}</p>
                  </div>
                  <StatusBadge active={cat.active} id={cat._id} />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <div className="flex-1">
                    <EditCategoryModal category={cat} fullWidth />
                  </div>
                  <DeleteButton id={cat._id} />
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              No hay categorías cargadas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// COMPONENTES PEQUEÑOS PARA LIMPIEZA
function StatusBadge({ active, id }) {
  return (
    <form action={async () => { "use server"; await toggleCategoryStatus(id, active); }}>
      <button className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
        active ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-amber-100 text-amber-600 hover:bg-amber-200"
      }`}>
        {active ? "● Activa" : "○ Inactiva"}
      </button>
    </form>
  );
}

function DeleteButton({ id }) {
  return (
    <form action={async () => { "use server"; await deleteCategory(id); }}>
      <button className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all">
        🗑️
      </button>
    </form>
  );
}