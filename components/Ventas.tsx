"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase'; 

interface VentasProps {
  stock: any[];
  setStock: React.Dispatch<React.SetStateAction<any[]>>;
  ventas: any[];
  setVentas: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Ventas({ stock, setStock, ventas, setVentas }: VentasProps) {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [ticketFinal, setTicketFinal] = useState<any>(null);
  const [verHistorial, setVerHistorial] = useState(false);
  
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  const cardStyle: React.CSSProperties = { backgroundColor: '#1e293b', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '1px solid #334155' };
  const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', width: '100%', outline: 'none' };

  useEffect(() => {
    if (busqueda.length > 0) {
      const filtrados = stock.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        item.codigo.toLowerCase().includes(busqueda.toLowerCase())
      );
      setSugerencias(filtrados);
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [busqueda, stock]);

  const seleccionarSugerencia = (producto: any) => {
    setProductoSeleccionado(producto);
    setBusqueda(producto.nombre);
    setMostrarSugerencias(false);
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    if (productoSeleccionado.cantidad < cantidadSeleccionada) return alert("Stock insuficiente.");
    
    const existe = carrito.find(item => item.id === productoSeleccionado.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === productoSeleccionado.id ? { ...item, unidades: item.unidades + cantidadSeleccionada } : item));
    } else {
      setCarrito([...carrito, { ...productoSeleccionado, unidades: cantidadSeleccionada }]);
    }
    setBusqueda('');
    setProductoSeleccionado(null);
  };

  const subtotalCarrito = () => carrito.reduce((acc, item) => acc + (item.precio * item.unidades), 0);
  const totalConDescuento = () => subtotalCarrito() - descuento;

  const imprimirTicketVenta = (datos: any) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    ventanaImpresion.document.write(`
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 5mm; font-size: 12px; color: #000; line-height: 1.3; font-weight: bold; }
            .text-center { text-align: center; }
            .extra-bold { font-weight: 900; }
            .divider { border-top: 2px solid #000; margin: 10px 0; }
            img { display: block; margin: 0 auto 5px; width: 60px; height: 60px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center">
          <img src="/logo.png" onerror="this.style.display='none'" />
            <div style="font-size: 18px;" class="extra-bold">CONTROLCEL</div>
            <div>Salta 1161 - Mendoza</div>
            <div>WEB: www.controlcelmendoza.com.ar</div>
            <div>Fecha: ${datos.fecha}</div>
          </div>
          <div class="divider"></div>
          <div class="text-center extra-bold">${datos.estado === 'cancelada' ? '⚠️ VENTA CANCELADA ⚠️' : 'COMPROBANTE DE VENTA'}</div>
          <div class="divider"></div>
          <table>
            <tbody>
              ${datos.items.map((i: any) => `
                <tr>
                  <td>${i.unidades}x ${i.nombre.slice(0,18)}</td>
                  <td style="text-align: right;">$${(i.unidades * i.precio).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between"><span>TOTAL:</span> <span>$${datos.total.toLocaleString()}</span></div>
          <div class="text-center extra-bold" style="margin-top:10px">PAGO: ${datos.metodo_pago.toUpperCase()}</div>
          <div>¡GRACIAS POR SU COMPRA!</div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;
    try {
      for (const item of carrito) {
        const { data: itemDb } = await supabase.from('stock').select('cantidad').eq('id', item.id).single();
        const nuevoStock = (itemDb?.cantidad || 0) - item.unidades;
        await supabase.from('stock').update({ cantidad: nuevoStock }).eq('id', item.id);
      }

      const nuevaVenta = { 
        id: Date.now(), 
        fecha: new Date().toLocaleString('es-AR'), 
        items: carrito, 
        subtotal: subtotalCarrito(),
        descuento: descuento,
        total: totalConDescuento(),
        metodo_pago: metodoPago,
        estado: 'completada'
      };

      const { error } = await supabase.from('ventas').insert([nuevaVenta]);
      if (error) throw error;

      setVentas([nuevaVenta, ...ventas]);
      setTicketFinal(nuevaVenta);
      imprimirTicketVenta(nuevaVenta);
      setCarrito([]);
      setDescuento(0);
    } catch (error: any) { alert("Error al procesar la venta: " + error.message); }
  };

  const cancelarVenta = async (venta: any) => {
    if (!window.confirm("¿Seguro que querés cancelar esta venta? El stock se devolverá automáticamente.")) return;
    
    try {
      // 1. Devolvemos el stock
      for (const item of venta.items) {
        const { data: itemDb } = await supabase.from('stock').select('cantidad').eq('id', item.id).single();
        const stockDevuelto = (itemDb?.cantidad || 0) + item.unidades;
        await supabase.from('stock').update({ cantidad: stockDevuelto }).eq('id', item.id);
      }

      // 2. Marcamos como cancelada en Supabase
      const { error } = await supabase.from('ventas').update({ estado: 'cancelada' }).eq('id', venta.id);
      if (error) throw error;

      // 3. Actualizamos estado local
      setVentas(ventas.map(v => v.id === venta.id ? { ...v, estado: 'cancelada' } : v));
      alert("Venta cancelada y stock devuelto.");
    } catch (e: any) {
      alert("Error al cancelar: " + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER CON BOTÓN HISTORIAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#f8fafc', fontWeight: '800', margin: 0 }}>💰 Módulo de Ventas</h2>
        <button 
          onClick={() => setVerHistorial(!verHistorial)}
          style={{ backgroundColor: verHistorial ? '#f87171' : '#334155', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {verHistorial ? '❌ CERRAR HISTORIAL' : '📜 HISTORIAL DE VENTAS'}
        </button>
      </div>

      {verHistorial ? (
        <div style={cardStyle}>
          <h3 style={{ color: '#3b82f6', marginBottom: '20px' }}>Historial Reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ventas.length === 0 ? <p>No hay ventas registradas.</p> : ventas.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#0f172a', borderRadius: '15px', border: v.estado === 'cancelada' ? '1px solid #7f1d1d' : '1px solid #334155' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: v.estado === 'cancelada' ? '#ef4444' : '#f8fafc' }}>
                    {v.estado === 'cancelada' ? '[CANCELADA] ' : ''}${v.total.toLocaleString()} - {v.metodo_pago}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.fecha}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => imprimirTicketVenta(v)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: '#334155', color: '#fff' }}>🖨️</button>
                  {v.estado !== 'cancelada' && (
                    <button onClick={() => cancelarVenta(v)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🚫 Cancelar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* BUSCADOR */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2, position: 'relative' }}>
                  <input type="text" placeholder="Buscar producto o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={inputStyle} />
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#1e293b', border: '1px solid #334155', zIndex: 10, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                      {sugerencias.map(s => (
                        <div key={s.id} onClick={() => seleccionarSugerencia(s)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', color: '#f8fafc' }}>
                          <span>{s.nombre}</span> <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>${s.precio}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" value={cantidadSeleccionada} onChange={e => setCantidadSeleccionada(Number(e.target.value))} style={{ ...inputStyle, flex: 0.5, textAlign: 'center' }} min="1" />
                <button onClick={agregarAlCarrito} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}>SUMAR</button>
              </div>
            </div>

            {/* CARRITO */}
            <div style={cardStyle}>
              <h3 style={{ marginBottom: '15px', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>🛒 Carrito</h3>
              {carrito.length === 0 && <p style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>Vacío.</p>}
              {carrito.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #334155', color: '#f8fafc' }}>
                  <span>{item.unidades}x {item.nombre}</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>${(item.precio * item.unidades).toLocaleString()}</span>
                    <button onClick={() => setCarrito(carrito.filter(c => c.id !== item.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>❌</button>
                  </div>
                </div>
              ))}

              {carrito.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>DESCUENTO $</label>
                      <input type="number" value={descuento} onChange={e => setDescuento(Number(e.target.value))} style={{...inputStyle, border: '1px solid #f87171'}} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>MÉTODO DE PAGO</label>
                      <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={inputStyle}>
                        <option>Efectivo</option>
                        <option>Transferencia</option>
                        <option>Tarjeta</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', backgroundColor: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#10b981' }}>TOTAL: ${totalConDescuento().toLocaleString()}</div>
                  </div>
                  <button onClick={finalizarVenta} style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }}>✅ FINALIZAR</button>
                </div>
              )}
            </div>
          </div>

          {/* ÚLTIMO TICKET */}
          <div style={{ position: 'sticky', top: '20px' }}>
            {ticketFinal ? (
              <div style={cardStyle}>
                 <h4 style={{ color: '#f8fafc', marginBottom: '10px', fontWeight: 'bold' }}>Última Venta</h4>
                 <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Total: <strong style={{color: '#10b981'}}>${ticketFinal.total.toLocaleString()}</strong><br/>
                    Método: <strong>{ticketFinal.metodo_pago}</strong>
                 </div>
                 <button onClick={() => imprimirTicketVenta(ticketFinal)} style={{ width: '100%', padding: '12px', backgroundColor: '#334155', color: '#fff', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ RE-IMPRIMIR</button>
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#475569', border: '2px dashed #334155', padding: '60px' }}>ESPERANDO VENTA</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}