// api.js
// Base API URL
const API_BASE_URL = 'http://localhost:5157/api'; // Cambiar por el puerto real HTTPS del backend

export const api = {
    async getProducts() {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('Error al cargar productos');
        return res.json();
    },
    async createOrder(orderData) {
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) throw new Error('Error al crear orden');
        return res.json();
    },
    async createMercadoPagoPreference(orderId) {
        const res = await fetch(`${API_BASE_URL}/payments/create-preference`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        if (!res.ok) throw new Error('Error al crear preferencia de pago');
        return res.json();
    }
};
