import { api } from './api.js';

let cart = [];
let products = [];

// DOM Elements
const productsContainer = document.getElementById('products');
const loader = document.getElementById('loader');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const toastElement = document.getElementById('toast');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    setupEventListeners();
    await loadProducts();
});

function setupEventListeners() {
    cartBtn.addEventListener('click', () => {
        cartModal.classList.remove('hidden');
        renderCart();
    });

    closeCart.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.add('hidden');
    });

    checkoutBtn.addEventListener('click', handleCheckout);
}

async function loadProducts() {
    loader.classList.remove('hidden');
    try {
        products = await api.getProducts();
        renderProducts();
    } catch (error) {
        console.warn("No se pudo conectar al backend real, cargando mocks...");
        loadMockProducts();
    } finally {
        loader.classList.add('hidden');
    }
}

function renderProducts() {
    productsContainer.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="btn-primary" onclick="window.addToCart(${product.id})">Agregar al Carrito</button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

function loadMockProducts() {
    products = [
        { id: 1, name: 'Camiseta Básica', description: 'Algodón 100%, ajuste perfecto.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
        { id: 2, name: 'Zapatillas Urbanas', description: 'Cómodas para el día a día.', price: 45.00, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
        { id: 3, name: 'Mochila Minimalista', description: 'Repelente al agua, diseño moderno.', price: 35.50, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
        { id: 4, name: 'Reloj Clásico', description: 'Correa de cuero, resistente al agua.', price: 89.90, imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' }
    ];
    renderProducts();
}

window.addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    showToast(`${product.name} agregado al carrito`);
};

function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = count;
}

window.updateQuantity = (productId, change) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart();
    }
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary); padding: 2rem 0;">Tu carrito está vacío</p>';
        cartTotalElement.textContent = '0.00';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.marginBottom = '1rem';
        div.style.paddingBottom = '1rem';
        div.style.borderBottom = '1px solid var(--card-bg)';
        
        div.innerHTML = `
            <div style="flex:1">
                <h4 style="margin-bottom:0.25rem">${item.name}</h4>
                <div style="color: var(--accent-color); font-weight: 600;">$${item.price.toFixed(2)}</div>
            </div>
            <div style="display:flex; align-items:center; gap: 0.5rem;">
                <button onclick="window.updateQuantity(${item.id}, -1)" style="padding: 0.2rem 0.5rem; background: var(--card-bg); color: white; border:none; cursor:pointer; border-radius: 4px;">-</button>
                <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                <button onclick="window.updateQuantity(${item.id}, 1)" style="padding: 0.2rem 0.5rem; background: var(--card-bg); color: white; border:none; cursor:pointer; border-radius: 4px;">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });
    cartTotalElement.textContent = total.toFixed(2);
}

function showToast(message, type = 'success') {
    toastElement.textContent = message;
    toastElement.className = `toast ${type}`;
    // force reflow to restart animation if needed
    void toastElement.offsetWidth;
    
    setTimeout(() => {
        toastElement.className = 'toast hidden';
    }, 3000);
}

// Agrega el parámetro 'e' (o 'event') a la función
async function handleCheckout(e) {
    // 1. Evita que la página se recargue automáticamente
    if (e) e.preventDefault(); 
    
    if (cart.length === 0) {
        showToast('El carrito está vacío', 'error');
        return;
    }
    
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Procesando...';
    
    try {
        // ... (el resto de tu lógica de orderData queda igual)
        const orderData = {
            customerName: "Cliente de Prueba",
            customerEmail: "cliente@demomail.com",
            items: cart.map(item => ({ 
                productId: item.id, 
                quantity: item.quantity, 
                unitPrice: item.price 
            }))
        };

        showToast('Creando orden...');

        const order = await api.createOrder(orderData);
        const preference = await api.createMercadoPagoPreference(order.id);
        
        // Redirigir a Mercado Pago
        if (preference.sandboxInitPoint || preference.initPoint) {
            window.location.href = preference.sandboxInitPoint || preference.initPoint;
        } else {
            throw new Error("No se recibió link de pago");
        }
    } catch (e) {
        console.error(e); // Importante para que veas el error real en la consola F12
        showToast('Error al iniciar el checkout', 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Finalizar Compra';
    }
}
