'use client'
import { useState, useMemo, useEffect, useRef } from "react"
import { 
  Check, DollarSign, Bike, Clock, AlertTriangle,
  Trash2, Plus, X, CreditCard, Wallet, Barcode, User
} from "lucide-react"

const PAYMENT_METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo', icon: Wallet },
  { id: 'DEBITO', name: 'Débito', icon: CreditCard },
  { id: 'CREDITO', name: 'Crédito', icon: CreditCard },
  { id: 'TRANSFERENCIA', name: 'Transferencia', icon: DollarSign }
]

// 🔐 PIN AUTORIZADO PARA CANCELACIONES
const ADMIN_PIN = "1234"

export default function PanelOrder({ initialOrders = [], updateOrderAction }) {
  const [orders, setOrders] = useState(initialOrders)
  
  // Modales Estados
  const [isCobrarModalOpen, setIsCobrarModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Modal Despacho Cadete
  const [isDespachoModalOpen, setIsDespachoModalOpen] = useState(false)
  const [orderToDispatch, setOrderToDispatch] = useState(null)
  const [cadeteNameInput, setCadeteNameInput] = useState("")

  // Modal Cancelación
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [reasonInput, setReasonInput] = useState("")
  const [pinInput, setPinInput] = useState("") 
  const [pinError, setPinError] = useState("") 

  // Modal Ver Listado Cancelados e Historial
  const [isHistoryCancelOpen, setIsHistoryCancelOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1) 

  // Lector de barras
  const [barcodeInput, setBarcodeInput] = useState("")
  const [payments, setPayments] = useState([{ method: 'EFECTIVO', amount: 0 }])
  const [errorMsg, setErrorMsg] = useState("")
  const barcodeRef = useRef(null)

  useEffect(() => {
    if (isCobrarModalOpen && barcodeRef.current) {
      barcodeRef.current.focus()
    }
  }, [isCobrarModalOpen])

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // --- CORRECCIÓN EN FILTROS: Mantenemos mapeo limpio en tiempo real ---
  const pedidosProceso = useMemo(() => orders.filter(o => o.status === 'PROCESO'), [orders])
  const pedidosEnviados = useMemo(() => orders.filter(o => o.status === 'ENVIADO'), [orders])
  const pedidosCancelados = useMemo(() => orders.filter(o => o.status === 'CANCELADO'), [orders])

  // LÓGICA DEL PAGINADOR (10 por página)
  const itemsPorPagina = 10
  const totalPaginas = Math.ceil(pedidosCancelados.length / itemsPorPagina) || 1
  
  const canceladosPaginados = useMemo(() => {
    const inicio = (currentPage - 1) * itemsPorPagina
    const fin = inicio + itemsPorPagina
    return pedidosCancelados.slice(inicio, fin)
  }, [pedidosCancelados, currentPage])

  useEffect(() => {
    if (isHistoryCancelOpen) setCurrentPage(1)
  }, [isHistoryCancelOpen])

  // --- ESCÁNER ---
  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcodeInput) return
    const ordenEncontrada = orders.find(o => String(o.number) === barcodeInput.trim())

    if (ordenEncontrada) {
      if (ordenEncontrada.status === 'COBRADO' || ordenEncontrada.status === 'CANCELADO') {
        alert(`Atención: Esta orden figura como ${ordenEncontrada.status} y no se puede operar.`)
        setBarcodeInput("")
        return
      }
      setSelectedOrder(ordenEncontrada)
      setPayments([{ method: 'EFECTIVO', amount: ordenEncontrada.total }])
      setErrorMsg("")
    } else {
      alert(`No se encontró ningún pedido activo con el número #${barcodeInput}`)
    }
    setBarcodeInput("")
  }

  // --- MULTIPAGO ---
  const agregarFormaPago = () => setPayments([...payments, { method: 'DEBITO', amount: 0 }])
  const eliminarFormaPago = (index) => setPayments(payments.filter((_, i) => i !== index))
  const cambiarPagoRow = (index, campo, valor) => {
    const nuevosPagos = [...payments]
    nuevosPagos[index][campo] = campo === 'amount' ? parseFloat(valor) || 0 : valor
    setPayments(nuevosPagos)
  }
  const totalPagado = useMemo(() => payments.reduce((acc, curr) => acc + curr.amount, 0), [payments])
  const restante = selectedOrder ? selectedOrder.total - totalPagado : 0

  // --- ACCIÓN: GUARDAR COBRO FINAL ---
  const handleFinalizarCobro = async () => {
    if (Math.abs(restante) > 0.01) {
      setErrorMsg(`El total debe coincidir exactamente.`)
      return
    }

    const targetOrderId = selectedOrder._id;
    const datosCobro = {
      orderId: targetOrderId,
      payments: payments.map(p => ({ method: p.method, amount: p.amount })),
      status: 'COBRADO',
      paidAt: new Date().toISOString()
    }

    // Cambiamos el estado a COBRADO en lugar de eliminarlo del array por completo
    setOrders(prev => prev.map(o => o._id === targetOrderId ? { ...o, status: 'COBRADO' } : o))
    setIsCobrarModalOpen(false)
    setSelectedOrder(null)

    await updateOrderAction(datosCobro)
  }

  // --- ACCIÓN: PREPARAR DESPACHO ---
  const abrirModalDespacho = (order) => {
    setOrderToDispatch(order)
    setCadeteNameInput("") 
    setIsDespachoModalOpen(true)
  }

  const confirmarDespacho = async () => {
    const nombreCadete = cadeteNameInput.trim() || "Retira en Local"
    const targetOrderId = orderToDispatch._id;

    setOrders(prev => prev.map(o => o._id === targetOrderId 
      ? { ...o, status: 'ENVIADO', cadete: nombreCadete } 
      : o
    ))
    
    setIsDespachoModalOpen(false)
    setOrderToDispatch(null)

    await updateOrderAction({ 
      orderId: targetOrderId, 
      status: 'ENVIADO',
      cadete: nombreCadete 
    })
  }

  // --- ACCIÓN: CANCELAR COMANDA ---
  const abrirModalCancelacion = (order) => {
    setOrderToCancel(order)
    setReasonInput("")
    setPinInput("")      
    setPinError("")     
    setIsCancelModalOpen(true)
  }

  const confirmarCancelacion = async () => {
    if (!reasonInput.trim()) {
      alert("Por favor ingrese un motivo válido para la cancelación.")
      return
    }

    if (pinInput !== ADMIN_PIN) {
      setPinError("El código de autorización ingresado es incorrecto.")
      return
    }

    const targetOrderId = orderToCancel._id;
    const motivoText = reasonInput.trim();
    const fechaCancelado = new Date().toISOString();

    // MODIFICACIÓN CRÍTICA AQUÍ: Cambia el estado a CANCELADO y le inyecta las propiedades de cancelación en vivo
    setOrders(prev => prev.map(o => o._id === targetOrderId 
      ? { ...o, status: 'CANCELADO', cancelReason: motivoText, reason: motivoText, canceledAt: fechaCancelado } 
      : o
    ))
    
    setIsCancelModalOpen(false)
    setOrderToCancel(null)

    try {
      await updateOrderAction({ 
        orderId: String(targetOrderId), 
        status: 'CANCELADO',
        cancelReason: String(motivoText),
        canceledAt: fechaCancelado
      })
    } catch (error) {
      console.error("Error al impactar en MongoDB:", error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 p-6 overflow-hidden font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel Control de Comandas</h1>
          <p className="text-sm text-slate-500 font-medium">Auditoría de Cajas Integrada con MongoDB</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsHistoryCancelOpen(true)}
            className="px-5 py-4 bg-white hover:bg-slate-50 text-red-600 border border-slate-200 rounded-2xl font-bold shadow-sm flex items-center gap-2 transition-all text-xs uppercase"
          >
            <AlertTriangle size={16}/> Historial Cancelados ({pedidosCancelados.length})
          </button>

          <button
            onClick={() => setIsCobrarModalOpen(true)}
            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center gap-3 transition-all tracking-wider uppercase text-xs"
          >
            <Barcode size={20} strokeWidth={2.5}/> Registrar Cobro / Entrega
          </button>
        </div>
      </div>

      {/* COLUMNAS */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* EN COCINA */}
        <div className="w-1/2 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-700">
              <Clock size={18} className="text-amber-500"/> En Cocina / Preparación
            </h2>
            <span className="bg-amber-50 text-amber-600 text-xs px-3 py-1 rounded-full font-black">{pedidosProceso.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pedidosProceso.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm font-medium italic">Sin pedidos en preparación</p>
            ) : (
              pedidosProceso.map(order => (
                <div key={order._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group hover:border-slate-300 transition-all">
                  
                  <button 
                    onClick={() => abrirModalCancelacion(order)}
                    className="absolute top-3 right-3 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg border border-slate-100 shadow-sm transition-colors"
                    title="Anular Pedido"
                  >
                    <Trash2 size={14}/>
                  </button>

                  <div className="flex justify-between items-start mb-2 pr-6">
                    <div>
                      <span className="text-xs font-black text-indigo-600">ORDEN #{order.number}</span>
                      <h3 className="font-bold text-sm text-slate-800">{order.customerName || "Sin Nombre"}</h3>
                    </div>
                    <span className="text-lg font-black text-slate-700">${order.total?.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium truncate mb-4">📍 {order.address || "Retira en Local"}</p>
                  
                  <button
                    onClick={() => abrirModalDespacho(order)}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Bike size={16}/> Despachar Pedido...
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EN VIAJE */}
        <div className="w-1/2 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-700">
              <Bike size={18} className="text-indigo-500"/> Repartidores en Viaje / Mostrador
            </h2>
            <span className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1 rounded-full font-black">{pedidosEnviados.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pedidosEnviados.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm font-medium italic">No hay repartos activos</p>
            ) : (
              pedidosEnviados.map(order => (
                <div key={order._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative hover:border-indigo-200 transition-all">
                  
                  <button 
                    onClick={() => abrirModalCancelacion(order)}
                    className="absolute top-3 right-3 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg border border-slate-100 shadow-sm transition-colors"
                  >
                    <Trash2 size={14}/>
                  </button>

                  <div className="flex justify-between items-start pr-6">
                    <div>
                      <span className="text-xs font-black text-indigo-600">ORDEN #{order.number}</span>
                      <h3 className="font-bold text-sm text-slate-800">{order.customerName || "Sin Nombre"}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">📍 {order.address || "Mostrador"}</p>
                      
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        <User size={10}/> {order.cadete || "Retira en Local"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-700 block">${order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL AUDITORÍA CON PAGINADOR HISTÓRICO */}
      {isHistoryCancelOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[230] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20}/>
                <h3 className="font-black text-base uppercase tracking-tight">Historial General de Anulaciones</h3>
              </div>
              <button onClick={() => setIsHistoryCancelOpen(false)} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50">
              {canceladosPaginados.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-sm italic font-medium">No se registran órdenes canceladas en el sistema.</p>
              ) : (
                canceladosPaginados.map(order => (
                  <div key={order._id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">#{order.number}</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{order.customerName || "Sin Nombre"}</h4>
                      </div>
                      <span className="text-sm font-black text-slate-400">${order.total?.toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200">
                      <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">Motivo de Anulación Obligatorio:</p>
                      <p className="text-xs font-semibold text-slate-700 italic">
                        "{order.cancelReason || order.reason || "No se cargó un motivo explicativo."}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* CONTROLES DE PAGINACIÓN */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:shadow-none"
                >
                  Anterior
                </button>
                <button 
                  disabled={currentPage === totalPaginas}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaginas))}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:shadow-none"
                >
                  Siguiente
                </button>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Página {currentPage} de {totalPaginas}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LOS DEMÁS MODALES (DESPACHO, CANCELACIÓN, COBRO) QUEDAN EXACTAMENTE IGUAL ABAJO */}
      {isDespachoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-800">Asignar Repartidor / Estado</h3>
              <p className="text-xs text-slate-400">¿Quién despacha la comanda de {orderToDispatch?.customerName}?</p>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Ej: Repartidor Moto, Nombre..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              value={cadeteNameInput}
              onChange={e => setCadeteNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmarDespacho(); }}
            />
            <div className="flex gap-2">
              <button onClick={() => setIsDespachoModalOpen(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={confirmarDespacho} className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Confirmar Salida</button>
            </div>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[220] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="font-bold text-base text-red-600">Anular Comanda del Sistema</h3>
              <p className="text-xs text-slate-400">Orden #{orderToCancel?.number} - {orderToCancel?.customerName}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-wider uppercase text-slate-400">Motivo de la Anulacion:</label>
              <textarea
                rows="2"
                placeholder="Explicación requerida para control de caja..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-xs text-slate-700 outline-none focus:border-red-500 focus:bg-white"
                value={reasonInput}
                onChange={e => setReasonInput(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-wider uppercase text-slate-400">Código de Autorización Encargado:</label>
              <input
                type="password"
                maxLength="6"
                placeholder="••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-black text-center tracking-widest text-sm text-slate-700 outline-none focus:border-red-500 focus:bg-white"
                value={pinInput}
                onChange={e => {
                  setPinError("");
                  setPinInput(e.target.value);
                }}
              />
              {pinError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2 rounded-xl text-center mt-1">
                  ⚠️ {pinError}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCancelModalOpen(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Volver Detrás</button>
              <button onClick={confirmarCancelacion} className="w-1/2 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-100">Anular Comanda</button>
            </div>
          </div>
        </div>
      )}

      {isCobrarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-slate-800">Cierre e Ingreso de Caja</h3>
              <button onClick={() => { setIsCobrarModalOpen(false); setSelectedOrder(null); }} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              {!selectedOrder && (
                <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 ml-1">Pase el lector óptico sobre el ticket impreso:</label>
                  <input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Esperando código de barras..."
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl outline-none focus:border-indigo-500 text-center font-bold tracking-widest text-lg"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                  />
                </form>
              )}
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-indigo-600">COMANDA #{selectedOrder.number}</p>
                      <h4 className="font-bold text-slate-800">{selectedOrder.customerName}</h4>
                      <p className="text-xs text-slate-400">Entrega/Envío: {selectedOrder.cadete || "No definido"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-800">${selectedOrder.total?.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-slate-400">Distribución de Caja</h4>
                      <button type="button" onClick={agregarFormaPago} className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                        <Plus size={14}/> Dividir Pago
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto">
                      {payments.map((pay, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <select
                            value={pay.method}
                            onChange={e => cambiarPagoRow(idx, 'method', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                          >
                            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-right font-black"
                            value={pay.amount || ""}
                            onChange={e => cambiarPagoRow(idx, 'amount', e.target.value)}
                          />
                          {payments.length > 1 && (
                            <button type="button" onClick={() => eliminarFormaPago(idx)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                    <div>Rendido: <span className="font-black">${totalPagado.toFixed(2)}</span></div>
                    {restante > 0 ? (
                      <div className="text-amber-600">Faltan: ${restante.toFixed(2)}</div>
                    ) : restante < 0 ? (
                      <div className="text-red-600">Excedente: ${Math.abs(restante).toFixed(2)}</div>
                    ) : (
                      <div className="text-emerald-600">✓ Pago Completo</div>
                    )}
                  </div>
                  {errorMsg && <p className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-xl">{errorMsg}</p>}
                  <button
                    onClick={handleFinalizarCobro}
                    disabled={Math.abs(restante) > 0.01}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase"
                  >
                    Confirmar Entrega y Archivar Caja
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}