"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import Stock from '../components/GestionStock';
import Ventas from '../components/Ventas';
import Facturacion from '../components/Facturacion';
import ClientesCC from '../components/ClientesCC'; 
import MercadoLibre from '../components/MercadoLibre'; // Importamos el nuevo componente

export default function SistemaGestionApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const [activeTab, setActiveTab] = useState('inicio'); 
  const [ventas, setVentas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]); 
  const [ventasML, setVentasML] = useState<any[]>([]); // Estado para ventas de Mercado Libre

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatos();
    }
  }, [isAuthenticated]);

  const cargarDatos = async () => {
    try {
      const { data: dataStock } = await supabase.from('stock').select('*').order('nombre', { ascending: true });
      if (dataStock) setStock(dataStock);

      const { data: dataClientes } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (dataClientes) setClientes(dataClientes);

      const { data: dataVentas, error: errorVentas } = await supabase
        .from('ventas')
        .select('*')
        .order('id', { ascending: false });

      if (errorVentas) {
        console.error("Error al traer ventas:", errorVentas.message);
      } else if (dataVentas) {
        setVentas(dataVentas);
      }

      // Traemos las notificaciones de ventas de Mercado Libre
      const { data: dataML } = await supabase
        .from('notificaciones_ml')
        .select('*')
        .order('created_at', { ascending: false });
      if (dataML) setVentasML(dataML);

    } catch (error) {
      console.error("Error general cargando datos:", error);
    }
  };

  // --- LÓGICA DE ESTADÍSTICAS ---
  const hoy = new Date().toLocaleDateString('es-AR');

  const datosGraficoVentas = useMemo(() => {
    const ultimos7Dias = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('es-AR');
    }).reverse();

    return ultimos7Dias.map(fecha => {
      const vDia = ventas.filter(v => v.fecha?.includes(fecha)).reduce((acc, v) => acc + (Number(v.total) || 0), 0);
      return { 
        fecha: fecha.split('/')[0] + '/' + fecha.split('/')[1], 
        total: vDia 
      };
    });
  }, [ventas]);

  const totalVentasCaja = ventas.filter(v => v.fecha?.includes(hoy)).reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const productosBajoStock = stock.filter(s => s.cantidad <= 3);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin1234') { 
      setIsAuthenticated(true); 
    } else { 
      alert('Usuario o contraseña incorrectos'); 
    }
  };

  const cardStyle = {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    border: '1px solid #334155',
    textAlign: 'center' as 'center'
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '100%', maxWidth: '350px', border: '1px solid #334155' }}>
          <center>
            <h1 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.5rem' }}>SISTEMA DE<span style={{ color: '#3b82f6' }}> GESTIÓN</span></h1>
          </center>
          <input type="text" placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#334155', color: '#fff' }} />
          <input type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: 'none', backgroundColor: '#334155', color: '#fff' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {activeTab === 'inicio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>VENTAS DEL DÍA ({hoy})</div>
                <div style={{ color: '#10b981', fontSize: '1.8rem', fontWeight: '900' }}>${totalVentasCaja.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>VENTAS ML PENDIENTES</div>
                <div style={{ color: '#facc15', fontSize: '1.8rem', fontWeight: '900' }}>{ventasML.length}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid #334155', minHeight: '350px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#94a3b8', textAlign: 'center' }}>RENDIMIENTO DE VENTAS (7 DÍAS)</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficoVentas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && <Stock stock={stock} setStock={setStock} />}
        {activeTab === 'ventas' && <Ventas stock={stock} setStock={setStock} ventas={ventas} setVentas={setVentas} />}
        {activeTab === 'clientes' && <ClientesCC />} 
        {activeTab === 'facturacion' && <Facturacion />}
        {/* Nueva pestaña de Mercado Libre */}
        {activeTab === 'mercadolibre' && <MercadoLibre ventasML={ventasML} setVentasML={setVentasML} />}
      </main>
    </div>
  );
}