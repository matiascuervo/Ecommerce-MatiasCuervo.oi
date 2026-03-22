// Base API URL
const API_BASE_URL = 'http://localhost:5001/api'; 

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

const tabProducts = document.getElementById('tab-products');
const tabOrders = document.getElementById('tab-orders');
const viewProducts = document.getElementById('view-products');
const viewOrders = document.getElementById('view-orders');
const toastElement = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminToken')) {
        showDashboard();
    }
});

loginBtn.addEventListener('click', async () => {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (!user || !pass) {
        showToast('Completa ambos campos', 'error');
        return;
    }

    try {
        loginBtn.textContent = 'Verificando...';
        loginBtn.disabled = true;
        
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('adminToken', data.token);
            showDashboard();
            showToast('Sesión iniciada correctamente');
        } else {
            showToast('Credenciales incorrectas', 'error');
        }
    } catch (e) {
        showToast('Error de red al conectar con el servidor', 'error');
    } finally {
        loginBtn.textContent = 'Ingresar al Panel';
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

tabProducts.addEventListener('click', () => {
    viewProducts.classList.remove('hidden');
    viewOrders.classList.add('hidden');
    tabProducts.classList.add('active');
    tabOrders.classList.remove('active');
    loadProducts();
});

tabOrders.addEventListener('click', () => {
    viewOrders.classList.remove('hidden');
    viewProducts.classList.add('hidden');
    tabOrders.classList.add('active');
    tabProducts.classList.remove('active');
    loadOrders();
});

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadProducts();
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('Error de conexión');
        const products = await res.json();
        
        const tbody = document.getElementById('admin-products-table');
        tbody.innerHTML = '';
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay productos registrados</td></tr>';
            return;
        }

        products.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>#${p.id}</td>
                    <td style="font-weight:600;">${p.name}</td>
                    <td style="color:var(--accent-color); font-weight:600;">$${p.price.toFixed(2)}</td>
                    <td>${p.stock} unid.</td>
                    <td>
                        <button style="background:var(--primary-color); color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:600;">Editar</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading products", e);
        showToast('Error al cargar productos (Asegúrate de que el backend esté corriendo)', 'error');
    }
}

async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (!res.ok) throw new Error('Error de conexión');
        const orders = await res.json();
        
        const tbody = document.getElementById('admin-orders-table');
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay pedidos registrados</td></tr>';
            return;
        }

        orders.forEach(o => {
            let statusClass = 'status-pending';
            if (o.paymentStatus.toLowerCase() === 'success' || o.paymentStatus.toLowerCase() === 'approved') statusClass = 'status-success';
            if (o.paymentStatus.toLowerCase() === 'failed') statusClass = 'status-failed';

            tbody.innerHTML += `
                <tr>
                    <td>#${o.id}</td>
                    <td>${o.customerName}</td>
                    <td style="color:var(--accent-color); font-weight:600;">$${o.totalAmount.toFixed(2)}</td>
                    <td><span class="badge-status ${statusClass}">${o.paymentStatus}</span></td>
                    <td>${o.paymentMethod}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading orders", e);
        showToast('Error al cargar pedidos', 'error');
    }
}

function showToast(message, type = 'success') {
    toastElement.textContent = message;
    toastElement.className = `toast ${type}`;
    void toastElement.offsetWidth;
    setTimeout(() => { toastElement.className = 'toast hidden'; }, 3000);
}
