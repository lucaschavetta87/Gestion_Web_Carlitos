export const consultarVentasML = async (accessToken: string) => {
  try {
    const respuesta = await fetch(`https://api.mercadolibre.com/orders/search?seller=me&order.status=paid`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const datos = await respuesta.json();
    return datos.results; // Aquí vienen las ventas reales
  } catch (error) {
    console.error("Error consultando ML:", error);
    return [];
  }
};