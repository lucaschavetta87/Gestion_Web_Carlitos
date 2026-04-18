"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase';

export default function Facturacion() {
  const [form, setForm] = useState({ nombre: '', cuit: '', total: '' });
  const [tipoIva, setTipoIva] = useState('Consumidor Final');
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    const { data } = await supabase
      .from('pendientes_facturar')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);
    if (data) setHistorial(data);
  };

  const verUltimoTicket = async () => {
    const { data, error } = await supabase
      .from('pendientes_facturar')
      .select('*')
      .eq('estado', 'procesado')
      .order('id', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return alert("No se encontró ninguna factura procesada recientemente.");
    }

    imprimirTicketFactura(data[0]);
  };

  const facturarARCA = async () => {
    const cuitLimpio = form.cuit.replace(/\D/g, '');
    const mTotal = parseFloat(form.total) || 0;

    if (mTotal <= 0) return alert("El total debe ser mayor a 0");
    if (!form.cuit) return alert("El CUIT/DNI es obligatorio");

    setCargando(true);

    const neto = Math.round((mTotal / 1.21) * 100) / 100;
    const ivaM = Math.round((mTotal - neto) * 100) / 100;
    const tipoComp = tipoIva === "IVA RI" ? 1 : 6; 
    const letra = tipoComp === 1 ? "A" : "B";

    const { error } = await supabase.from('pendientes_facturar').insert([{
      cliente: form.nombre.toUpperCase() || 'CONSUMIDOR FINAL',
      cuit: cuitLimpio,
      total: mTotal,
      neto: neto,
      iva: ivaM,
      tipo_comp: tipoComp,
      letra: letra,
      estado: 'pendiente'
    }]);

    if (error) {
      alert("Error al conectar con Supabase: " + error.message);
    } else {
      alert(`🚀 Solicitud enviada.\nEl script de Python en el local generará el CAE en segundos.`);
      setForm({ nombre: '', cuit: '', total: '' });
      setTimeout(cargarHistorial, 3000);
    }
    setCargando(false);
  };

  const imprimirTicketFactura = (datos: any) => {
    const ventana = window.open('', '_blank');
    if (!ventana) return;

    const qrData = {
        ver: 1,
        fecha: new Date(datos.fecha).toISOString().split('T')[0],
        cuit: 20382057830,
        ptoVta: 1,
        tipoCmp: datos.tipo_comp,
        nroCmp: datos.nro_comprobante,
        importe: datos.total,
        moneda: "PES",
        ctz: 1,
        tipoDocRec: datos.cuit.length > 8 ? 80 : 96,
        nroDocRec: parseInt(datos.cuit),
        tipoCodAut: "E",
        codAut: parseInt(datos.cae)
    };
    const qrEncoded = btoa(JSON.stringify(qrData));
    const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${qrEncoded}`;

    ventana.document.write(`
      <html>
        <head>
          <title>Factura ${datos.letra} - ControlCel</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 5mm; 
              font-size: 11px; 
              color: #000; 
              line-height: 1.3;
              font-weight: bold; /* TODO EL TICKET EN NEGRITA */
            }
            .text-center { text-align: center; }
            .extra-bold { font-weight: 900; }
            .divider { border-top: 2px solid #000; margin: 8px 0; }
            .factura-letra { border: 3px solid #000; padding: 5px 10px; font-size: 26px; display: inline-block; margin-bottom: 5px; font-weight: 900; }
            img { display: block; margin: 0 auto 5px; width: 60px; height: 60px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <img src="/logo.png" onerror="this.style.display='none'" />
            <div style="font-size: 20px;" class="extra-bold">CONTROLCEL</div>
            <div class="extra-bold">SERVICIO TÉCNICO</div>
            <div>Salta 1161 - Mendoza</div>
            <div>WEB: www.controlcelmendoza.com.ar</div>
            <div class="extra-bold">CUIT: 20-38205783-0</div>
            <div>Fecha: ${new Date(datos.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="divider"></div>
          <div class="text-center">
            <div class="factura-letra">${datos.letra}</div>
            <div class="extra-bold">COD. ${datos.tipo_comp.toString().padStart(2, '0')}</div>
            <div class="extra-bold">FACTURA ELECTRÓNICA</div>
            <div class="extra-bold">Nro: ${datos.nro_comprobante ? datos.nro_comprobante.toString().padStart(8, '0') : 'Pnd.'}</div>
          </div>
          <div class="divider"></div>
          <div>CLIENTE: ${datos.cliente}</div>
          <div>CUIT/DNI: ${datos.cuit}</div>
          <div class="divider"></div>
          
          ${datos.letra === 'A' ? `
            <div style="display:flex; justify-content:space-between"><span>Neto Gravado:</span> <span>$${datos.neto.toLocaleString('es-AR')}</span></div>
            <div style="display:flex; justify-content:space-between"><span>IVA 21%:</span> <span>$${datos.iva.toLocaleString('es-AR')}</span></div>
          ` : ''}
          
          <div style="display:flex; justify-content:space-between; font-size: 15px;" class="extra-bold">
            <span>TOTAL:</span> <span>$${datos.total.toLocaleString('es-AR')}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center">
             <div style="margin-bottom:10px">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" style="width:130px; height:130px; border: 1px solid #000;"/>
             </div>
             <div class="extra-bold" style="font-size: 13px;">CAE: ${datos.cae || 'Pnd.'}</div>
             <div style="font-size: 9px; margin-top: 5px;" class="extra-bold">Comprobante autorizado por ARCA</div>
             <div class="extra-bold" style="margin-top: 15px;">¡GRACIAS POR SU COMPRA!</div>
          </div>
          <script>window.onload = function() { window.print(); setTimeout(window.close, 800); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div style={cardFactura}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontWeight: '800' }}>🚀 ARCA</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={verUltimoTicket} style={btnIcono} title="Re-imprimir último">🖨️ Último</button>
                <button onClick={() => {setMostrarHistorial(!mostrarHistorial); cargarHistorial();}} style={btnIcono}>
                    {mostrarHistorial ? '✎ Facturar' : '🕒 Historial'}
                </button>
            </div>
        </div>
        
        {!mostrarHistorial ? (
            <>
                <input style={inputS} placeholder="Nombre Cliente" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                <input style={inputS} placeholder="CUIT / DNI" value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} />
                <input style={{...inputS, fontSize: '1.5rem', fontWeight: '900', border: '2px solid #10b981', color: '#10b981'}} placeholder="TOTAL $" value={form.total} onChange={e => setForm({...form, total: e.target.value})} />
                
                <select style={inputS} value={tipoIva} onChange={e => setTipoIva(e.target.value)}>
                    <option>Consumidor Final</option>
                    <option>IVA RI</option>
                </select>

                <button onClick={facturarARCA} disabled={cargando} style={btnFactura}>
                    {cargando ? 'PROCESANDO...' : '🚀 GENERAR FACTURA LEGAL'}
                </button>
            </>
        ) : (
            <div style={{ textAlign: 'left', maxHeight: '400px', overflowY: 'auto' }}>
                {historial.map(f => (
                    <div key={f.id} style={{ padding: '15px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', marginBottom: '8px', borderRadius: '12px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#f8fafc' }}>{f.cliente}</div>
                            <div style={{ fontSize: '0.75rem', color: f.estado === 'procesado' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                ${f.total} - {f.estado.toUpperCase()}
                            </div>
                        </div>
                        {f.estado === 'procesado' && (
                            <button onClick={() => imprimirTicketFactura(f)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️</button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

const cardFactura = { 
    backgroundColor: '#1e293b', 
    padding: '30px', 
    borderRadius: '24px', 
    border: '1px solid #334155', 
    width: '100%', 
    maxWidth: '480px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)' 
};

const inputS = { 
    width: '100%', 
    padding: '12px', 
    marginBottom: '12px', 
    borderRadius: '12px', 
    border: '1px solid #334155', 
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    outline: 'none', 
    fontSize: '1rem' 
};

const btnFactura = { 
    width: '100%', 
    padding: '16px', 
    backgroundColor: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '15px', 
    fontWeight: '900' as 'bold', 
    cursor: 'pointer', 
    fontSize: '1.1rem', 
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    marginTop: '10px'
};

const btnIcono = { 
    backgroundColor: '#334155', 
    color: '#f8fafc', 
    border: '1px solid #475569', 
    padding: '8px 14px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '0.75rem', 
    fontWeight: 'bold' as 'bold' 
};