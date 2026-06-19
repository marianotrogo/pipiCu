'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChefHat, 
  BarChart3, 
  ShoppingBag, 
  LogOut,
  Store,
  FolderTree,
  Users,
  ReceiptText // <-- Importamos el nuevo icono para Órdenes
} from 'lucide-react'

// Array de navegación completamente actualizado con Órdenes incluido
const NAVIGATION_ITEMS = [
  { name: 'Cocina y Envíos', href: '/admin/panel', icon: ChefHat },
  { name: 'Órdenes', href: '/admin/ordenes', icon: ReceiptText }, // <-- ¡Agregado acá!
  { name: 'Reportes y Caja', href: '/admin/reportes', icon: BarChart3 },
  { name: 'Productos', href: '/admin/productos', icon: ShoppingBag },
  { name: 'Categorías', href: '/admin/categorias', icon: FolderTree },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased text-slate-800">
      
      {/* SIDEBAR NAVEGADOR FIXED */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 h-full select-none">
        
        {/* TOP: LOGO / NOMBRE DEL NEGOCIO */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Store size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-900 leading-tight">Pipi Cucu</h2>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Sistema Activo</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* MENÚ DE ENLACES */}
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* BOTTOM: PERFIL / ACCIÓN DE SALIDA */}
        <div className="space-y-4">
          <hr className="border-slate-100" />
          
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-600 border border-slate-300">
              CA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">Cajero Principal</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">Turno Mañana</p>
            </div>
          </div>

          <Link
            href="/logout"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut size={18} />
            Salir del Sistema
          </Link>
        </div>

      </aside>

      {/* CONTENEDOR DE LAS PÁGINAS DENTRO DEL LAYOUT */}
      <main className="flex-1 h-full overflow-hidden bg-slate-50 relative">
        {children}
      </main>

    </div>
  )
}