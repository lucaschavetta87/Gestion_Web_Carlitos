"use client";

import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  
  // Estilo base para los botones de navegación
  const navButtonStyle = (tabName: string): React.CSSProperties => {
    const isFacturacion = tabName === 'facturacion';
    const isClientes = tabName === 'clientes';
    const isML = tabName === 'mercadolibre'; // Definimos el estilo para ML
    const isActive = activeTab === tabName;

    return {
      padding: '10px 18px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: isActive 
        ? (isFacturacion ? '#27ae60' : isClientes ? '#8b5cf6' : isML ? '#facc15' : '#3b82f6') 
        : 'transparent',
      color: isActive ? (isML ? '#000' : '#ffffff') : '#94a3b8', // Texto negro si ML está activo para mejor contraste
      boxShadow: isActive 
        ? `0 4px 12px ${isFacturacion ? 'rgba(39, 174, 96, 0.3)' : isClientes ? 'rgba(139, 92, 246, 0.3)' : isML ? 'rgba(250, 204, 21, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` 
        : 'none',
    };
  };

  return (
    <header style={headerStyle}>
      {/* LADO IZQUIERDO: NOMBRE DEL SISTEMA */}
      <div 
        onClick={() => setActiveTab('inicio')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' }}>
          GESTIÓN<span style={{ color: '#3b82f6' }}>WEB</span>
        </div>
      </div>

      {/* CENTRO: NAVEGACIÓN FILTRADA */}
      <nav style={{ 
        display: 'flex', 
        gap: '4px', 
        backgroundColor: '#1e293b', 
        padding: '5px', 
        borderRadius: '16px',
        border: '1px solid #334155'
      }}>
        <button onClick={() => setActiveTab('stock')} style={navButtonStyle('stock')}>
          📦 Stock
        </button>

        <button onClick={() => setActiveTab('ventas')} style={navButtonStyle('ventas')}>
          💰 Ventas
        </button>

        <button onClick={() => setActiveTab('mercadolibre')} style={navButtonStyle('mercadolibre')}>
          🟡 ML
        </button>

        <button onClick={() => setActiveTab('clientes')} style={navButtonStyle('clientes')}>
          💳 Clientes
        </button>

        <button onClick={() => setActiveTab('facturacion')} style={navButtonStyle('facturacion')}>
          🚀 ARCA
        </button>
      </nav>

      {/* LADO DERECHO: UBICACIÓN */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Mendoza, AR
        </div>
        <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>
        </div>
      </div>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 30px',
  backgroundColor: 'rgba(15, 23, 42, 0.8)', 
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid #334155',
  position: 'sticky',
  top: '15px',
  margin: '0 20px',
  borderRadius: '20px',
  zIndex: 1000,
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
};