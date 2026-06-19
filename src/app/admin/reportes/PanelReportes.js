'use client'
import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, DollarSign, TrendingUp, ShoppingBag, 
  ClipboardList, Lock, RefreshCw, FileText, X, ShieldAlert
} from "lucide-react"
import { obtenerDatosReporteAction } from "../../actions/reports" 

export default function PanelReportes({ initialOrders = [], initialTurno = null }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [errorPin, setErrorPin] = useState(false)
  const [filtroPeriodo, setFiltroPeriodo] = useState("hoy") // hoy, semana, mes, anio
  const [loading, setLoading] = useState(false) 
  
  // Control del modal, tabla y paginador de cobrados
  const [isModalCobradosOpen, setIsModalCobradosOpen] = useState(false)
  const [pedidosCobrados, setPedidosCobrados] = useState(initialOrders)
  const [pageCobrados, setPageCobrados] = useState(1)
  const itemsPorPagina = 8

  // Estado que maneja los datos de caja (esquema Turno)
  const [turnoActivo, setTurnoActivo] = useState(initialTurno)

  // Función procesadora en JavaScript puro para armar los KPIs de órdenes
  const procesarReporte = (listaDeOrdenes) => {
    const porMetodo = { EFECTIVO: 0, CREDITO: 0, TRANSFERENCIA: 0, QR: 0, CUENTA_CORRIENTE: 0, PAGOS_CUENTA_CORRIENTE: 0 }
    let totalIngresos = 0
    let comandasEmitidas = 0
    const hashProductos = {}

    listaDeOrdenes.forEach(order => {
      if (order.status === 'ENTREGADO') {
        comandasEmitidas++
        totalIngresos += order.total || 0

        // Desglose por método de pago
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach(p => {
            const m = p.method
            if (porMetodo[m] !== undefined) {
              porMetodo[m] += p.amount || 0
            }
          })
        } else {
          porMetodo.EFECTIVO += order.total || 0
        }

        // Conteo para ranking de productos
        if (order.items) {
          order.items.forEach(it => {
            hashProductos[it.name] = (hashProductos[it.name] || 0) + it.qty
          })
        }
      }
    })

    const rankingProductos = Object.entries(hashProductos)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)

    const productoMasVendido = rankingProductos[0] || { name: "Ninguno", qty: 0 }

    return { totalIngresos, porMetodo, comandasEmitidas, rankingProductos, productoMasVendido }
  }

  // Inicializamos el estado del reporte procesando la data inicial que viene del server
  const [reporte, setReporte] = useState(() => procesarReporte(initialOrders))

  const PIN_CORRECTO = "1234"

  // Efecto corregido: solo reacciona cuando cambia el filtro de tiempo o el rol de administrador
  useEffect(() => {
    if (filtroPeriodo === "hoy" && !isAdmin) {
      setReporte(procesarReporte(initialOrders))
      setPedidosCobrados(initialOrders)
      setTurnoActivo(initialTurno)
      return
    }

    async function cargarData() {
      setLoading(true)
      const periodoAQuery = isAdmin ? filtroPeriodo : "hoy"
      const res = await obtenerDatosReporteAction(periodoAQuery)
      
      if (res.success) {
        if (res.data.pedidosDetail || res.data.pedidosDetalle) {
          setPedidosCobrados(res.data.pedidosDetail || res.data.pedidosDetalle)
          setReporte(res.data)
        } else {
          const ordenesBackend = res.data.orders || res.data || []
          setPedidosCobrados(ordenesBackend)
          setReporte(procesarReporte(ordenesBackend))
        }

        if (res.data.turno) {
          setTurnoActivo(res.data.turno)
        }
      }
      setLoading(false)
    }
    cargarData()
  }, [filtroPeriodo, isAdmin]) // Se removieron initialOrders e initialTurno para evitar re-renders infinitos

  useEffect(() => {
    setPageCobrados(1)
  }, [isModalCobradosOpen, filtroPeriodo])

  // Paginación de la tabla interna del modal
  const totalPaginasCobrados = Math.ceil(pedidosCobrados.length / itemsPorPagina) || 1
  const cobradosPaginados = useMemo(() => {
    const inicio = (pageCobrados - 1) * itemsPorPagina
    return pedidosCobrados.slice(inicio, inicio + itemsPorPagina)
  }, [pedidosCobrados, pageCobrados])

  const manejarLoginAdmin = (e) => {
    e.preventDefault()
    if (pinInput === PIN_CORRECTO) {
      setIsAdmin(true)
      setErrorPin(false)
      setFiltroPeriodo("semana") 
    } else {
      setErrorPin(true)
    }
  }

  const cerrarVistaAdmin = () => {
    setIsAdmin(false)
    setPinInput("")
    setFiltroPeriodo("hoy")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 p-4 md:p-6 overflow-y-auto md:overflow-hidden font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-indigo-600 shrink-0"/> 
            {!isAdmin ? "Corte del Día Actual y Caja" : `Auditoría Gerencial: [${filtroPeriodo.toUpperCase()}]`}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {!isAdmin ? "📊 (Reseteo automático a las 00:00)." : "🔓 Historial de facturación consolidado extraído de la base de datos."}
          </p>
        </div>

        {/* CONTROLES */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
          <button
            onClick={() => setIsModalCobradosOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold shadow-md shadow-emerald-100 flex items-center justify-center gap-2 text-xs transition-colors h-9"
          >
            <FileText size={14}/> Ver Pedidos Cobrados ({pedidosCobrados.length})
          </button>

          {!isAdmin ? (
            <form onSubmit={manejarLoginAdmin} className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm gap-1 w-full sm:w-auto">
              <input 
                type="password" 
                placeholder="PIN Historial"
                maxLength={4}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 outline-none flex-1 sm:w-28 text-center bg-slate-50 rounded-lg"
              />
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0">
                <Lock size={12}/> Ver Históricos
              </button>
            </form>
          ) : (
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm gap-2 items-center justify-between sm:justify-start w-full sm:w-auto">
              <div className="flex gap-0.5 flex-1 sm:flex-none">
                <button onClick={() => setFiltroPeriodo("semana")} className={`flex-1 sm:flex-none px-2 py-1 rounded-lg text-xs font-bold transition-all ${filtroPeriodo === 'semana' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Semana</button>
                <button onClick={() => setFiltroPeriodo("mes")} className={`flex-1 sm:flex-none px-2 py-1 rounded-lg text-xs font-bold transition-all ${filtroPeriodo === 'mes' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Mensual</button>
                <button onClick={() => setFiltroPeriodo("anio")} className={`flex-1 sm:flex-none px-2 py-1 rounded-lg text-xs font-bold transition-all ${filtroPeriodo === 'anio' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Anual</button>
              </div>
              <div className="h-4 w-px bg-slate-200 hidden sm:block"/>
              <button onClick={cerrarVistaAdmin} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors">
                Cerrar X
              </button>
            </div>
          )}
        </div>
      </div>

      {errorPin && !isAdmin && (
        <p className="text-[11px] text-red-500 font-bold -mt-4 mb-4">❌ PIN incorrecto. Intente de nuevo.</p>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[250px]">
          <RefreshCw className="animate-spin text-indigo-600" size={28}/>
          <span className="text-xs font-bold">Consultando MongoDB...</span>
        </div>
      ) : (
        <>
          {/* SECCIÓN DE DATOS DE TURNO / CAJA COMPLEMENTARIA */}
          {turnoActivo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado de la Caja</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border ${turnoActivo.estado === 'ABIERTO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {turnoActivo.estado}
                  </span>
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-600">
                    Turno: {turnoActivo.tipo}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold truncate">Resp: {turnoActivo.abiertoPor || 'No asignado'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto Apertura</p>
                  <h4 className="text-base font-black text-slate-700">${turnoActivo.montoApertura?.toFixed(2) || "0.00"}</h4>
                </div>
                <ClipboardList size={18} className="text-slate-400"/>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto Cierre</p>
                  <h4 className="text-base font-black text-slate-700">${turnoActivo.montoCierre?.toFixed(2) || "0.00"}</h4>
                </div>
                <DollarSign size={18} className="text-slate-400"/>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 mb-4">
              <ShieldAlert size={16} className="text-amber-600 shrink-0"/>
              <p className="text-[11px] text-amber-800 font-bold">No se detectaron datos de turnos o aperturas registrados para este corte temporal.</p>
            </div>
          )}

          {/* GRID METRICS PRINCIPALES DE VENTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={24} strokeWidth={2.5}/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recaudado</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">${reporte.totalIngresos.toFixed(2)}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <ClipboardList size={24}/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comandas Salidas</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{reporte.comandasEmitidas}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp size={24}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto Más Vendido</p>
                <h3 className="text-base md:text-lg font-black text-slate-800 truncate">{reporte.productoMasVendido.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{reporte.productoMasVendido.qty} un. liquidables</p>
              </div>
            </div>
          </div>

          {/* LOWER PANELS */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 md:overflow-hidden pb-4 md:pb-0">
            <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col max-h-[350px] md:max-h-none">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">Segregación Medios de Pago</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {Object.entries(reporte.porMetodo).map(([metodo, valor]) => (
                  <div key={metodo} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700 tracking-wide block">{metodo.replace(/_/g, ' ')}</span>
                    <span className="font-black text-sm text-slate-800">${valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-2/3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col overflow-hidden max-h-[400px] md:max-h-none">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">Productos Salidos</h2>
                <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-0.5 rounded-full font-bold">{reporte.rankingProductos.length} Items</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {reporte.rankingProductos.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs italic font-medium">Sin registros en este bloque temporal.</div>
                ) : (
                  reporte.rankingProductos.map((prod, index) => (
                    <div key={prod.name} className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 bg-indigo-50 text-indigo-600 font-black text-xs rounded-lg flex items-center justify-center shrink-0">{index + 1}</span>
                        <span className="text-xs font-bold text-slate-800 truncate">{prod.name}</span>
                      </div>
                      <span className="text-xs font-black bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 shadow-sm flex items-center gap-1 shrink-0">
                        <ShoppingBag size={11} className="text-slate-400"/> {prod.qty} un.
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL DE AUDITORÍA DETALLADA */}
      {isModalCobradosOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] sm:max-h-[85vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div className="flex items-center gap-2 text-emerald-700 min-w-0">
                <FileText size={18} className="shrink-0" />
                <h3 className="font-black text-xs sm:text-sm md:text-base uppercase tracking-tight truncate">Auditoría: {filtroPeriodo.toUpperCase()}</h3>
              </div>
              <button onClick={() => setIsModalCobradosOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors shrink-0">
                <X size={20}/>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50 md:bg-white p-3 md:p-0">
              {cobradosPaginados.length === 0 ? (
                <div className="text-center text-slate-400 py-20 text-xs sm:text-sm italic font-medium">No hay registros de cobros para este período.</div>
              ) : (
                <>
                  {/* MOBILE CARDS */}
                  <div className="block md:hidden space-y-3">
                    {cobradosPaginados.map(order => (
                      <div key={order._id || order.number} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded text-xs">Pedido #{order.number}</span>
                          <span className="font-black text-slate-950 text-sm">${order.total?.toFixed(2)}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Cliente:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{order.customerName || "Consumidor Final"}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Productos:</span>
                          <div className="text-slate-600 space-y-0.5 mt-1 max-h-20 overflow-y-auto bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((it, i) => (
                                <div key={i} className="truncate"><span className="font-bold text-slate-700">{it.qty}x</span> {it.name}</div>
                              ))
                            ) : (
                              <span className="italic text-slate-400">Sin ítems</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Pagos:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.payments && order.payments.length > 0 ? (
                              order.payments.map((p, i) => (
                                <span key={i} className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 text-[10px]">{p.method}: ${Number(p.amount).toFixed(2)}</span>
                              ))
                            ) : (
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 text-[10px]">EFECTIVO: ${order.total?.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE */}
                  <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black tracking-wider text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-4 px-6">Pedido</th>
                        <th className="py-4 px-6">Cliente</th>
                        <th className="py-4 px-6">Productos</th>
                        <th className="py-4 px-6">Medios de Pago</th>
                        <th className="py-4 px-6 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {cobradosPaginados.map(order => (
                        <tr key={order._id || order.number} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6"><span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">#{order.number}</span></td>
                          <td className="py-4 px-6 font-bold text-slate-900">{order.customerName || "Consumidor Final"}</td>
                          <td className="py-4 px-6 max-w-[280px]">
                            <div className="space-y-0.5 text-slate-500 max-h-[64px] overflow-y-auto pr-1">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((it, i) => (
                                  <div key={i} className="truncate"><span className="font-bold text-slate-700">{it.qty}x</span> {it.name}</div>
                                ))
                              ) : (
                                <span className="italic text-slate-400">Sin ítems</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {order.payments && order.payments.length > 0 ? (
                                order.payments.map((p, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md text-[10px] border border-slate-200">{p.method}: ${Number(p.amount).toFixed(2)}</span>
                                ))
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md text-[10px] border border-slate-200">EFECTIVO: ${order.total?.toFixed(2)}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-slate-950 text-sm">${order.total?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* PAGINACIÓN */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <button 
                  disabled={pageCobrados === 1}
                  onClick={() => setPageCobrados(prev => Math.max(prev - 1, 1))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all active:bg-slate-100"
                >
                  Anterior
                </button>
                <button 
                  disabled={pageCobrados === totalPaginasCobrados}
                  onClick={() => setPageCobrados(prev => Math.min(prev + 1, totalPaginasCobrados))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all active:bg-slate-100"
                >
                  Siguiente
                </button>
              </div>
              <span className="text-xs font-bold text-slate-500">{pageCobrados} de {totalPaginasCobrados}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}