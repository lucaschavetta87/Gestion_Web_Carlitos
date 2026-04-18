"use client";
import React, { useState, useEffect } from 'react';
import { consultarVentasML } from '../app/ml_api'; // Importamos la función que creamos

interface VentasMLProps {
  ventasML: any[];
  setVentasML: (ventas: any[]) => void;
}

export default function MercadoLibre({ ventasML, setVentasML }: VentasMLProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Función para sincronizar ventas manualmente (por si el webhook tarda)
  const sincronizarAhora = async () => {
    setIsSyncing(true);
    const token = process.env.NEXT_PUBLIC_ML_ACCESS_TOKEN;
    if (token) {
      const ventasReales = await consultarVentasML(token);
      // Mapeamos los datos de ML al formato que espera tu lista
      const formateadas = ventasReales.map((v: any) => ({
        id: v.id,
        created_at: v.date_created,
        detalle_venta: {
          comprador: v.buyer.nickname,
          producto: v.order_items[0].item.title,
          total: v.total_amount,
          datos_fiscales: v.buyer.billing_info // Importante para la factura
        }
      }));
      setVentasML(formateadas);
    }
    setIsSyncing(false);
  };

  const generarFacturaML = async (venta: any) => {
    setLoadingId(venta.id);
    try {
      console.log("Iniciando facturación ARCA para:", venta.detalle_venta.comprador);
      
      // Aquí conectaremos con tu componente de Facturacion
      // Por ahora, simulamos la creación del PDF A4
      const docNombre = `Factura_ML_${venta.id}.pdf`;
      
      alert(`Factura A4 generada para ${venta.detalle_venta.comprador}. \nDocumento: ${docNombre}`);
      
      // Lógica para quitarla de la lista de "pendientes" una vez facturada
      setVentasML(ventasML.filter(v => v.id !== venta.id));

    } catch (error) {
      console.error("Error al facturar:", error);
      alert("Error al procesar la factura con ARCA");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1e293b', borderRadius: '24px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Ventas Mercado Libre</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '5px 0 0 0' }}>Sincronizado con tu cuenta real</p>
        </div>
        <button 
          onClick={sincronizarAhora}
          disabled={isSyncing}
          style={btnSyncStyle}
        >
          {isSyncing ? '🔄 Actualizando...' : '🔄 Sincronizar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {ventasML.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No hay ventas pendientes de facturar.</div>
        ) : (
          ventasML.map((venta) => (
            <div key={venta.id} style={itemStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {venta.detalle_venta?.comprador} 
                  <span style={{ fontSize: '0.7rem', color: '#facc15', border: '1px solid #facc15', padding: '2px 6px', borderRadius: '6px' }}>ML</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
                  {venta.detalle_venta?.producto}
                </div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                   <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>${venta.detalle_venta?.total?.toLocaleString()}</div>
                   <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(venta.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <button 
                onClick={() => generarFacturaML(venta)}
                disabled={loadingId === venta.id}
                style={{ 
                  ...btnFacturarStyle,
                  backgroundColor: loadingId === venta.id ? '#475569' : '#27ae60'
                }}
              >
                {loadingId === venta.id ? 'Procesando...' : '📄 Facturar A4'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#0f172a',
  borderRadius: '16px',
  border: '1px solid #334155'
};

const btnFacturarStyle: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.2s'
};

const btnSyncStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#facc15',
  border: '1px solid #facc15',
  padding: '8px 15px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 'bold'
};