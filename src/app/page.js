'use client'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-8 font-sans antialiased">
      
      {/* TOP: BRANDING SIMPLE */}
      <div className="w-full max-w-5xl mx-auto pt-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            PIPI<span className="text-neutral-500">CUCU</span>
          </h1>
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Gestión y Auditoría Gastronómica
          </p>
        </div>
      </div>

      {/* CENTER: ACCESOS DIRECTOS */}
      <div className="w-full max-w-5xl mx-auto my-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* OPCIÓN 1: OPERACIONES */}
          <Link 
            href="/admin/panel"
            className="group block border border-neutral-200 bg-neutral-50 p-6 transition-all duration-200 hover:bg-neutral-100 hover:border-neutral-400"
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-lg font-bold uppercase tracking-tight">
                Panel de Operaciones
              </h2>
              <ArrowUpRight size={16} className="text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black" />
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-md">
              Monitoreo de comandas en tiempo real, cocina, despachos y cobros rápidos.
            </p>
          </Link>

          {/* OPCIÓN 2: REPORTES */}
          <Link 
            href="/admin/reportes"
            className="group block border border-neutral-200 bg-neutral-50 p-6 transition-all duration-200 hover:bg-neutral-100 hover:border-neutral-400"
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-lg font-bold uppercase tracking-tight">
                Reportes y Auditoría
              </h2>
              <ArrowUpRight size={16} className="text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black" />
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-md">
              Cierre de caja, analíticas de ventas, medios de pago e inventarios de stock.
            </p>
          </Link>

        </div>
      </div>

      {/* BOTTOM: FOOTER */}
      <div className="w-full max-w-5xl mx-auto pb-4 border-t border-neutral-100 pt-4 flex justify-between items-center text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
        <span>Mariano Trogo Sistemas</span>
        <span>Pro Web Studio</span>
        <span>v3.0</span>
      </div>

    </div>
  )
}