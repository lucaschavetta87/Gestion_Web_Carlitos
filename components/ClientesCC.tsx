"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase';

export default function ClientesCC() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [esGremio, setEsGremio] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  
  // Estados para el detalle de órdenes
  const [clienteExpandido, setClienteExpandido] = useState<any>(null);
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);

  // Estilos
  const cardStyle: React.CSSProperties = { backgroundColor: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
  const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', width: '100%', outline: 'none', marginBottom: '15px' };
  const btnStyle: React.CSSProperties = { padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };

  const cargarClientes = async () => {
    setCargando(true);
    const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
    if (data) setClientes(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Función para ver órdenes pendientes de un cliente específico
  const verDetalleCliente = async (cliente: any) => {
    setClienteExpandido(cliente);
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .eq('cliente_id', cliente.id)
      .neq('estado_orden', 'Entregado'); // Solo lo que no se entregó/cobró
    
    if (data) setOrdenesPendientes(data);
  };

  const crearCliente = async () => {
    if (!nombre.trim()) return alert("Por favor, ingresa al menos el nombre.");
    try {
      const { error } = await supabase.from('clientes').insert([{ nombre, telefono, es_gremio: esGremio, saldo_cc: 0 }]);
      if (error) throw error;
      alert("Cliente guardado con éxito");
      setNombre(''); setTelefono(''); setEsGremio(false);
      cargarClientes();
    } catch (error: any) { alert("Error: " + error.message); }
  };

  const registrarPago = async (cliente: any) => {
    const monto = prompt(`¿Cuánto va a abonar ${cliente.nombre}? (Saldo actual: $${cliente.saldo_cc})`);
    if (!monto || isNaN(Number(monto))) return;
    const nuevoSaldo = cliente.saldo_cc - Number(monto);

    const { error } = await supabase.from('clientes').update({ saldo_cc: nuevoSaldo }).eq('id', cliente.id);
    if (!error) {
      alert("Pago registrado correctamente");
      cargarClientes();
      setClienteExpandido(null);
    }
  };

  const saldarTotal = async (cliente: any) => {
    if (window.confirm(`¿Confirmas que ${cliente.nombre} saldó la deuda TOTAL de $${cliente.saldo_cc}?`)) {
      // 1. Ponemos saldo en 0
      const { error: err1 } = await supabase.from('clientes').update({ saldo_cc: 0 }).eq('id', cliente.id);
      
      // 2. Marcamos sus órdenes como entregadas
      const { error: err2 } = await supabase.from('ordenes')
        .update({ estado_orden: 'Entregado' })
        .eq('cliente_id', cliente.id)
        .neq('estado_orden', 'Entregado');

      if (!err1 && !err2) {
        alert("✅ Cuenta saldada y órdenes marcadas como entregadas.");
        cargarClientes();
        setClienteExpandido(null);
      }
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    (c.telefono && c.telefono.includes(filtro))
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '25px', padding: '10px' }}>
      
      {/* COLUMNA IZQUIERDA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={cardStyle}>
          <h2 style={{ color: '#f8fafc', marginBottom: '20px', fontSize: '1.4rem' }}>👤 Registrar Cliente</h2>
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>NOMBRE COMPLETO / NEGOCIO</label>
          <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Pérez o Service Cel" />
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>TELÉFONO / WHATSAPP</label>
          <input style={inputStyle} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 261..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => setEsGremio(!esGremio)}>
            <input type="checkbox" checked={esGremio} readOnly />
            <span style={{ color: '#f8fafc', fontSize: '0.9rem' }}>¿Es cliente de Gremio?</span>
          </div>
          <button onClick={crearCliente} style={{ ...btnStyle, backgroundColor: '#3b82f6', color: '#fff', width: '100%' }}>➕ GUARDAR CLIENTE</button>
        </div>

        <div style={{ ...cardStyle, textAlign: 'center' }}>
            <h4 style={{ color: '#94a3b8', margin: 0 }}>Total Deuda en Calle</h4>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f87171' }}>
                ${clientes.reduce((acc, c) => acc + (c.saldo_cc || 0), 0).toLocaleString()}
            </div>
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div style={cardStyle}>
        {!clienteExpandido ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#f8fafc', margin: 0 }}>💳 Cuentas Corrientes</h2>
              <input placeholder="🔍 Buscar cliente..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ ...inputStyle, width: '300px', marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clientesFiltrados.map(cliente => (
                <div key={cliente.id} 
                  onClick={() => verDetalleCliente(cliente)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', backgroundColor: '#0f172a', borderRadius: '15px', border: cliente.saldo_cc > 0 ? '1px solid #4ade8055' : '1px solid #334155', cursor: 'pointer', transition: '0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#161e2e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '1.1rem' }}>{cliente.nombre}</span>
                      {cliente.es_gremio && <span style={{ backgroundColor: '#1d4ed8', color: '#fff', fontSize: '0.6rem', padding: '3px 8px', borderRadius: '5px' }}>GREMIO</span>}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>📞 {cliente.telefono || 'Sin teléfono'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold' }}>SALDO PENDIENTE</div>
                    <div style={{ color: cliente.saldo_cc > 0 ? '#f87171' : '#10b981', fontSize: '1.4rem', fontWeight: '900' }}>
                      ${cliente.saldo_cc.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#3b82f6' }}>Click para ver trabajos 🔍</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* DETALLE DEL CLIENTE SELECCIONADO */
          <div>
            <button onClick={() => setClienteExpandido(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>⬅️ VOLVER AL LISTADO</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
               <div>
                  <h2 style={{ color: '#fff', margin: 0 }}>{clienteExpandido.nombre}</h2>
                  <p style={{ color: '#94a3b8', margin: 0 }}>Trabajos pendientes de pago</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f87171', fontSize: '1.8rem', fontWeight: '900' }}>Total: ${clienteExpandido.saldo_cc.toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => registrarPago(clienteExpandido)} style={{ ...btnStyle, backgroundColor: '#334155', color: '#fff' }}>💸 ABONAR PARCIAL</button>
                    <button onClick={() => saldarTotal(clienteExpandido)} style={{ ...btnStyle, backgroundColor: '#10b981', color: '#fff' }}>✅ SALDAR TODO</button>
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {ordenesPendientes.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>No hay órdenes pendientes registradas para este cliente.</p>
              ) : (
                ordenesPendientes.map(orden => (
                  <div key={orden.id} style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid #334155' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{orden.equipo}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{orden.falla} - {orden.fecha}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#f87171' }}>$ {orden.saldo}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}