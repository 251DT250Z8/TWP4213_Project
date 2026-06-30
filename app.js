// --- UTILITIES ---
const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const safeParse = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { localStorage.removeItem(key); return fallback; }
};

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';

window.handleImageError = (img, placeholder = PLACEHOLDER_IMAGE) => {
    img.onerror = null; img.src = placeholder;
};

const formatOrderDate = (dateValue) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- DATA LAYER (API INTEGRATION) ---
const API_URL = 'api.php'; // Ensure api.php is in the same directory on your server

let localUsers = [];
let localProducts = [];
let localCategories = [];
let localOrders = [];
let localComments = [];
let localCart = safeParse('storeCart', []);

// Sync state from Database
const fetchStoreData = async () => {
    try {
        const res = await fetch(API_URL + '?action=getAll');
        const data = await res.json();

        localUsers = (data.users || []).map(u => ({ ...u, id: parseInt(u.id) }));
        localCategories = (data.categories || []).map(c => ({ ...c, id: parseInt(c.id) }));
        localProducts = (data.products || []).map(p => ({
            ...p, id: parseInt(p.id), category_id: parseInt(p.category_id), price: parseFloat(p.price), stock: parseInt(p.stock, 10)
        }));
        localOrders = (data.orders || []).map(o => ({
            ...o, id: parseInt(o.id), user_id: parseInt(o.user_id), total: parseFloat(o.total)
        }));
        localComments = (data.comments || []).map(c => ({
            ...c, id: parseInt(c.id), product_id: parseInt(c.product_id), user_id: parseInt(c.user_id)
        }));
    } catch (e) { console.error("Database connection failed.", e); }
};

const apiCall = async (action, data = {}) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data })
        });
        return await res.json();
    } catch (e) { return { success: false, error: 'Server communication error.' }; }
};

window.saveCart = () => localStorage.setItem('storeCart', JSON.stringify(localCart));

// --- TOAST ALERTS ---
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message);
    const toast = document.createElement('div'); toast.className = `toast ${type}`;
    const msgSpan = document.createElement('span'); msgSpan.textContent = message;
    const closeBtn = document.createElement('strong'); closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'cursor:pointer; margin-left:10px;';
    closeBtn.onclick = () => toast.remove();
    toast.appendChild(msgSpan); toast.appendChild(closeBtn);
    container.appendChild(toast); setTimeout(() => toast.remove(), 3000);
};

// --- AUTHENTICATION ROUTING ---
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
const adminRoutes = ['admin-dashboard.html', 'manage-admin.html', 'manage-member.html', 'manage-category.html', 'manage-product.html', 'manage-order.html', 'sales-report.html'];
const customerRoutes = ['dashboard.html', 'profile.html', 'cart.html', 'checkout.html'];

if (adminRoutes.includes(currentFile)) {
    if (localStorage.getItem('isAdmin') !== 'true') window.location.href = 'index.html';
} else if (customerRoutes.includes(currentFile)) {
    if (localStorage.getItem('isCustomer') !== 'true' && localStorage.getItem('isAdmin') !== 'true') window.location.href = 'index.html';
}

window.checkVisualAuthState = () => {
    const adminState = document.getElementById('admin-state');
    const customerState = document.getElementById('customer-state');
    if (adminState) adminState.checked = localStorage.getItem('isAdmin') === 'true';
    if (customerState) customerState.checked = localStorage.getItem('isCustomer') === 'true';
};

window.togglePassword = (inputId, spanEl) => {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; spanEl.innerText = 'Hide'; }
    else { input.type = 'password'; spanEl.innerText = 'Show'; }
};

window.checkPasswordMatch = () => {
    const newPass = document.getElementById('prof-new-pass')?.value;
    const confirmPass = document.getElementById('prof-confirm-pass')?.value;
    const msg = document.getElementById('password-match-msg');
    const saveBtn = document.getElementById('profile-save-btn');
    if (!msg || !saveBtn) return;
    if (newPass || confirmPass) {
        if (newPass === confirmPass && newPass !== '') {
            msg.textContent = 'Passwords match'; msg.style.color = 'var(--success)';
            saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer';
        } else {
            msg.textContent = 'Passwords do not match'; msg.style.color = 'var(--danger)';
            saveBtn.disabled = true; saveBtn.style.opacity = '0.5'; saveBtn.style.cursor = 'not-allowed';
        }
    } else {
        msg.textContent = ''; saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer';
    }
};

window.handleRegister = async (event) => {
    event.preventDefault();
    const newUser = {
        email: document.getElementById('reg-email').value.toLowerCase().trim(),
        password: document.getElementById('reg-pass').value,
        firstName: document.getElementById('reg-fname').value.trim(),
        lastName: document.getElementById('reg-lname').value.trim()
    };
    const result = await apiCall('register', { user: newUser });
    if (result.success) {
        window.showToast('Registration successful!');
        setTimeout(() => { window.location.href = 'login.html'; }, 800);
    } else { window.showToast(result.error || 'Registration failed.', 'error'); }
};

window.handleUnifiedLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const password = document.getElementById('login-pass').value;
    const result = await apiCall('login', { email, password });
    if (result.success && result.user) {
        const user = result.user;
        localStorage.setItem('loggedInUserId', user.id);
        localStorage.setItem('loggedInEmail', user.email);
        if (user.role === 'admin') {
            localStorage.setItem('isAdmin', 'true'); localStorage.setItem('isCustomer', 'false');
            window.location.href = 'admin-dashboard.html';
        } else {
            localStorage.setItem('isAdmin', 'false'); localStorage.setItem('isCustomer', 'true');
            window.location.href = 'dashboard.html';
        }
    } else { window.showToast(result.error || 'Invalid email or password.', 'error'); }
};

window.handleLogout = () => {
    localStorage.setItem('isAdmin', 'false'); localStorage.setItem('isCustomer', 'false');
    localStorage.removeItem('loggedInEmail'); localStorage.removeItem('loggedInUserId');
    window.location.href = 'index.html';
};

window.handleUpdateProfile = async (event) => {
    event.preventDefault();
    const userId = parseInt(localStorage.getItem('loggedInUserId'));
    const userDoc = localUsers.find(u => u.id === userId);
    if (!userDoc) return window.showToast('Session expired. Please log in again.', 'error');

    const updatePayload = {
        id: userId,
        firstName: document.getElementById('prof-fname').value.trim(),
        lastName: document.getElementById('prof-lname').value.trim(),
        phoneExt: document.getElementById('prof-phone-ext').value,
        phone: document.getElementById('prof-phone').value,
        addr1: document.getElementById('prof-addr1').value,
        city: document.getElementById('prof-city').value,
        state: document.getElementById('prof-state').value,
        zip: document.getElementById('prof-zip').value,
        country: document.getElementById('prof-country').value,
        password: ''
    };

    const newPass = document.getElementById('prof-new-pass')?.value || '';
    const confirmPass = document.getElementById('prof-confirm-pass')?.value || '';
    if (newPass || confirmPass) {
        if (!newPass || !confirmPass) return window.showToast('Please fill out both password fields to change it.', 'error');
        if (newPass !== confirmPass) return window.showToast('Your new passwords do not match.', 'error');
        updatePayload.password = newPass;
    }

    const result = await apiCall('updateProfile', { user: updatePayload });
    if (result.success) {
        window.showToast('Profile successfully updated.', 'success');
        if (document.getElementById('prof-new-pass')) {
            document.getElementById('prof-new-pass').value = '';
            document.getElementById('prof-confirm-pass').value = '';
        }
        setTimeout(() => { window.location.href = localStorage.getItem('isAdmin') === 'true' ? 'admin-dashboard.html' : 'dashboard.html'; }, 800);
    } else { window.showToast('Failed to update profile.', 'error'); }
};

// --- DATA RENDERING FUNCTIONS ---
window.renderProducts = () => {
    const container = document.getElementById('products-grid');
    if (!container) return;
    const search = (document.getElementById('search-prod')?.value || '').toLowerCase();
    const filterCatId = document.getElementById('filter-cat')?.value || '';
    let filtered = localProducts.filter(p => p.name.toLowerCase().includes(search));
    if (filterCatId !== '') filtered = filtered.filter(p => p.category_id === parseInt(filterCatId));
    if (filtered.length === 0) { container.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No products found.</p>'; return; }

    container.innerHTML = filtered.map(p => `
        <div class="card">
            <img src="${escapeHtml(p.image || PLACEHOLDER_IMAGE)}" alt="${escapeHtml(p.name)}" class="card-img" style="object-fit: cover;" onerror="window.handleImageError(this)">
            <div class="card-body">
                <h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><div class="price">RM${p.price.toFixed(2)}</div>
                <div class="qty-stepper" style="margin-top:1rem; margin-bottom: 0.5rem;">
                    <button type="button" class="qty-btn" onclick="window.decreaseQty('qty-${p.id}')">−</button>
                    <input type="number" id="qty-${p.id}" value="1" readonly>
                    <button type="button" class="qty-btn" onclick="window.increaseQty('qty-${p.id}', ${p.stock})">+</button>
                </div>
                <button type="button" onclick="window.goToDetails(${p.id})" class="btn btn-outline" style="width:100%; margin-bottom:0.5rem;">View Details</button>
                <button type="button" onclick="window.addToCart(${p.id})" class="btn" style="width:100%">Add to Cart</button>
            </div>
        </div>
    `).join('');
};

window.goToDetails = (id) => { localStorage.setItem('viewingProductId', id); window.location.href = 'product-detail.html'; };
window.decreaseQty = (id) => { const el = document.getElementById(id); if (el && parseInt(el.value) > 1) el.value = parseInt(el.value) - 1; };
window.increaseQty = (id, max) => { const el = document.getElementById(id); if (el && parseInt(el.value) < max) el.value = parseInt(el.value) + 1; };

window.addToCart = (id, specificQty) => {
    if (localStorage.getItem('isCustomer') !== 'true' && localStorage.getItem('isAdmin') !== 'true') return window.location.href = 'login.html';
    const prod = localProducts.find(p => p.id === id);
    if (!prod) return window.showToast('Product not found.', 'error');
    let qty = specificQty || parseInt(document.getElementById(`qty-${id}`)?.value || 1);
    if (isNaN(qty) || qty < 1) qty = 1;
    const existing = localCart.find(i => i.id === id);
    if ((existing ? existing.quantity : 0) + qty > prod.stock) return window.showToast(`Max stock is ${prod.stock}.`, 'error');
    if (existing) existing.quantity += qty;
    else localCart.push({ id, name: prod.name, price: prod.price, quantity: qty });
    window.saveCart();
    window.showToast('Added to cart!');
    setTimeout(() => { window.location.href = 'cart.html'; }, 400);
};

// --- RENDER CART ---
window.updateCartQuantity = (id, newQty) => {
    const item = localCart.find(i => i.id === id);
    const prod = localProducts.find(p => p.id === id);
    if (item && prod) {
        if (newQty < 1) return;
        if (newQty > prod.stock) { window.showToast(`Max stock is ${prod.stock}.`, 'error'); item.quantity = prod.stock; }
        else item.quantity = newQty;
        item.price = prod.price; window.saveCart(); window.renderCart();
    }
};

window.removeFromCart = (id) => { localCart = localCart.filter(i => i.id !== id); window.saveCart(); window.renderCart(); window.showToast('Item removed.'); };

window.renderCart = () => {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    let html = ''; let subtotal = 0;
    if (localCart.length === 0) { html = `<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>`; }
    else {
        localCart.forEach((item) => {
            const prod = localProducts.find(p => p.id === item.id);
            if (prod) item.price = prod.price; else item.price = item.price || 0;
            const itemTotal = item.price * item.quantity; subtotal += itemTotal;
            html += `<tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td><div class="qty-stepper"><button class="qty-btn" onclick="window.updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button><input type="number" value="${item.quantity}" readonly><button class="qty-btn" onclick="window.updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button></div></td>
                <td>RM${item.price.toFixed(2)}</td><td>RM${itemTotal.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="window.removeFromCart(${item.id})">Remove</button></td>
            </tr>`;
        });
    }
    container.innerHTML = html;
    const finalTotal = subtotal + (subtotal * 0.06);
    if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').innerText = `RM${subtotal.toFixed(2)}`;
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = `RM${finalTotal.toFixed(2)}`;
    const checkoutBtn = document.querySelector('a[href="checkout.html"]');
    if (checkoutBtn) {
        checkoutBtn.style.pointerEvents = localCart.length === 0 ? 'none' : 'auto';
        checkoutBtn.style.opacity = localCart.length === 0 ? '0.5' : '1';
    }
};

window.formatCardNumber = (input) => { let val = input.value.replace(/\D/g, ''); input.value = (val.match(/.{1,4}/g)?.join(' ') || val).substring(0, 19); };

// --- CHECKOUT LOGIC ---
window.handleCheckout = async (event) => {
    event.preventDefault();
    if (localCart.length === 0) return window.showToast('Your cart is empty!', 'error');

    const form = event.target;
    const fullName = form.querySelector('#checkout-name')?.value?.trim();
    const cardNumber = form.querySelector('#checkout-card')?.value?.replace(/\s/g, '') || '';
    const expiryMonth = form.querySelector('#checkout-exp-month')?.value;
    const expiryYear = form.querySelector('#checkout-exp-year')?.value;
    const cvv = form.querySelector('#checkout-cvv')?.value || '';

    if (!fullName) return window.showToast('Please enter your full name.', 'error');
    if (cardNumber.length !== 16) return window.showToast('Please enter a valid 16-digit card number.', 'error');
    if (!expiryMonth || !expiryYear) return window.showToast('Please select card expiry date.', 'error');
    if (cvv.length !== 3) return window.showToast('Please enter a valid 3-digit CVV.', 'error');

    await fetchStoreData();
    for (const item of localCart) {
        const prod = localProducts.find(p => p.id === item.id);
        if (!prod) return window.showToast(`"${item.name}" is no longer available.`, 'error');
        if (item.quantity > prod.stock) return window.showToast(`Only ${prod.stock} of "${prod.name}" in stock.`, 'error');
        item.price = prod.price;
    }

    let subtotal = 0; localCart.forEach(item => { subtotal += item.price * item.quantity; });
    const finalTotal = subtotal + (subtotal * 0.06);

    const currentUserId = parseInt(localStorage.getItem('loggedInUserId'));
    if (!currentUserId || isNaN(currentUserId)) return window.location.href = 'login.html';

    const newOrder = { user_id: currentUserId, total: finalTotal, paymentName: fullName, items: localCart.map(i => ({ ...i })) };
    const orderRes = await apiCall('addOrder', { order: newOrder });
    if (!orderRes.success) return window.showToast('Failed to process order.', 'error');

    for (const item of localCart) { await apiCall('updateProductStock', { id: item.id, qty: item.quantity }); }
    localCart = []; window.saveCart(); window.showToast('Payment Successful! Order saved.');
    setTimeout(() => { window.location.href = localStorage.getItem('isAdmin') === 'true' ? 'admin-dashboard.html' : 'dashboard.html'; }, 800);
};

// --- COMMENTS ---
window.handleSubmitComment = async (event) => {
    event.preventDefault();
    const productId = parseInt(localStorage.getItem('viewingProductId'));
    const userId = parseInt(localStorage.getItem('loggedInUserId'));

    if (isNaN(productId)) return window.showToast('No product selected for review.', 'error');
    if (isNaN(userId)) return window.showToast('Please log in to review.', 'error');

    const title = document.getElementById('comment-title')?.value?.trim();
    const body = document.getElementById('comment-body')?.value?.trim();
    if (!title || !body) return window.showToast('Please fill in all review fields.', 'error');

    const newComment = { product_id: productId, user_id: userId, title, body };
    const res = await apiCall('addComment', { comment: newComment });
    if (res.success) {
        document.getElementById('comment-title').value = ''; document.getElementById('comment-body').value = '';
        window.showToast('Review submitted!'); await fetchStoreData(); window.renderComments();
    } else { window.showToast('Failed to save review.', 'error'); }
};

window.renderComments = () => {
    const productId = parseInt(localStorage.getItem('viewingProductId'));
    const product = localProducts.find(p => p.id === productId);
    const titleEl = document.getElementById('comments-product-name');
    const listEl = document.getElementById('comments-list');

    if (titleEl) titleEl.textContent = product ? `Reviews for ${product.name}` : 'Product Reviews';
    if (!listEl) return;

    const reviews = localComments.filter(c => c.product_id === productId);
    if (reviews.length === 0) { listEl.innerHTML = '<p class="text-center">No reviews yet. Be the first!</p>'; return; }

    listEl.innerHTML = reviews.map(c => {
        const userName = (c.firstName || c.lastName) ? `${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}` : 'Verified Buyer';
        return `
        <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
            <h3 style="margin-bottom: 0.25rem;">${escapeHtml(c.title)}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${escapeHtml(formatOrderDate(c.date))} · ${escapeHtml(userName)}</p>
            <p style="margin-bottom: 0;">${escapeHtml(c.body)}</p>
        </div>
    `}).join('');
};

// --- CHART LOGIC ---
window.salesChartInstance = null;
window.updateChart = () => {
    const ctx = document.getElementById('salesChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (window.salesChartInstance) window.salesChartInstance.destroy();

    const monthSelect = document.getElementById('report-month');
    const selectedMonth = monthSelect ? monthSelect.value : 'all';
    const currentYear = new Date().getFullYear();

    let labels = []; let data = [];

    if (selectedMonth === 'all') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const rev = new Array(12).fill(0);
        localOrders.forEach(o => { const d = new Date(o.date); if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) rev[d.getMonth()] += o.total; });
        const curr = new Date().getMonth();
        for (let i = 5; i >= 0; i--) { let m = curr - i; if (m < 0) m += 12; labels.push(months[m]); data.push(rev[m]); }
    } else {
        const targetMonth = parseInt(selectedMonth);
        const daysInMonth = new Date(currentYear, targetMonth + 1, 0).getDate();
        const rev = new Array(daysInMonth).fill(0);
        localOrders.forEach(o => {
            const d = new Date(o.date);
            if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === targetMonth) { rev[d.getDate() - 1] += o.total; }
        });
        for (let i = 1; i <= daysInMonth; i++) { labels.push(`Day ${i}`); data.push(rev[i - 1]); }
    }
    window.salesChartInstance = new Chart(ctx, {
        type: 'bar', data: { labels: labels, datasets: [{ label: 'Revenue (RM)', data: data, backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true } } }
    });
};

// --- MODULAR ADMIN RENDERERS ---
window.renderAdminUsers = () => {
    const adminTbody = document.getElementById('admin-admins-tbody');
    const custTbody = document.getElementById('admin-customers-tbody');
    if (!adminTbody && !custTbody) return;
    const render = (list, tbody) => {
        if (!tbody) return;
        if (list.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center">No users found.</td></tr>';
        else tbody.innerHTML = list.map(u => `<tr><td>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</td><td>${escapeHtml(u.email)}</td><td>
            <select onchange="window.updateUserRole(${u.id}, this.value)" style="padding: 0.2rem;"><option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option></select>
            </td><td><button class="btn btn-danger" onclick="window.deleteUser(${u.id})">Del</button></td></tr>`).join('');
    };
    render(localUsers.filter(u => u.role === 'admin'), adminTbody);
    render(localUsers.filter(u => u.role === 'customer'), custTbody);
};

window.renderAdminCategories = () => {
    const tbody = document.getElementById('admin-category-tbody');
    if (!tbody) return;
    tbody.innerHTML = localCategories.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${localProducts.filter(p => p.category_id === c.id).length}</td><td><button class="btn btn-danger" onclick="window.deleteCategory(${c.id})">Del</button></td></tr>`).join('');
};

window.renderAdminProducts = () => {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    tbody.innerHTML = localProducts.map(p => {
        const pCat = localCategories.find(c => c.id === p.category_id);
        const catName = pCat ? pCat.name : 'Unknown';
        return `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(catName)}</td><td>RM${p.price.toFixed(2)}</td><td>${p.stock}</td><td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; margin-right: 0.5rem;" onclick="window.openEditProductModal(${p.id})">Edit</button><button class="btn btn-danger" style="padding: 0.2rem 0.5rem;" onclick="window.deleteProduct(${p.id})">Del</button></td></tr>`;
    }).join('');
    const catDrop = document.getElementById('add-prod-cat');
    if (catDrop) catDrop.innerHTML = localCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
};

window.renderAdminOrders = () => {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = localOrders.map(o => {
        const user = localUsers.find(u => u.id === o.user_id);
        const emailLabel = user ? user.email : `User #${o.user_id}`;
        return `<tr><td>#${o.id}</td><td>${escapeHtml(emailLabel)}</td><td>RM${o.total.toFixed(2)}</td><td>
        <select onchange="window.updateOrderStatus(${o.id}, this.value)" style="padding: 0.2rem;"><option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option><option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option><option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option><option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select>
        </td><td><button class="btn btn-danger" onclick="window.deleteOrder(${o.id})">Del</button></td></tr>`;
    }).join('');
};

const validateProductFields = (price, stock) => {
    if (isNaN(price) || price < 0) return 'Price must be a non-negative number.';
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) return 'Stock must be a non-negative whole number.';
    return null;
};

// --- INITIALIZE PAGE LOGIC (ASYNC) ---
document.addEventListener('DOMContentLoaded', async () => {
    window.checkVisualAuthState();
    document.querySelectorAll('nav ul li a').forEach(link => {
        if (link.getAttribute('href') === currentFile || (currentFile === '' && link.getAttribute('href') === 'index.html')) link.classList.add('active-nav-link');
    });

    await fetchStoreData();

    window.renderAdminUsers(); window.renderAdminCategories(); window.renderAdminProducts(); window.renderAdminOrders();

    if (currentFile === 'products.html') {
        const filterCat = document.getElementById('filter-cat');
        if (filterCat) filterCat.innerHTML = '<option value="">All Categories</option>' + localCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        window.renderProducts();
    }

    if (currentFile === 'product-detail.html') {
        const id = parseInt(localStorage.getItem('viewingProductId'));
        const p = localProducts.find(x => x.id === id);
        if (!p) {
            document.getElementById('detail-name').innerText = 'Product not found';
            document.getElementById('detail-desc').innerHTML = '<p>This product may have been removed. <a href="products.html">Return to catalog</a>.</p>';
            if (document.getElementById('detail-add-btn')) document.getElementById('detail-add-btn').disabled = true;
        } else {
            document.getElementById('detail-name').innerText = p.name;
            document.getElementById('detail-price').innerText = 'RM' + p.price.toFixed(2);
            document.getElementById('detail-stock-count').innerText = p.stock || 0;
            document.getElementById('detail-desc').innerHTML = `<p>${escapeHtml(p.description || p.desc)}</p>`;
            if (document.getElementById('detail-image')) {
                const imgEl = document.getElementById('detail-image'); imgEl.src = p.image || PLACEHOLDER_IMAGE; imgEl.onerror = () => window.handleImageError(imgEl);
            }
            const qtyInput = document.getElementById('detail-qty'); qtyInput.max = p.stock;
            if (document.getElementById('detail-qty-inc')) document.getElementById('detail-qty-inc').onclick = () => window.increaseQty('detail-qty', p.stock);
            document.getElementById('detail-add-btn').onclick = () => window.addToCart(p.id, parseInt(document.getElementById('detail-qty').value));
            if (p.stock < 1) document.getElementById('detail-add-btn').disabled = true;
        }
    }

    if (currentFile === 'profile.html') {
        const emailInput = document.getElementById('prof-email');
        if (emailInput) emailInput.value = localStorage.getItem('loggedInEmail') || '';
        const userId = parseInt(localStorage.getItem('loggedInUserId'));
        const user = localUsers.find(u => u.id === userId);
        if (user) {
            if (document.getElementById('prof-fname')) document.getElementById('prof-fname').value = user.firstName || '';
            if (document.getElementById('prof-lname')) document.getElementById('prof-lname').value = user.lastName || '';
            if (document.getElementById('prof-phone-ext')) document.getElementById('prof-phone-ext').value = user.phoneExt || '+60';
            if (document.getElementById('prof-phone')) document.getElementById('prof-phone').value = user.phone || '';
            if (document.getElementById('prof-addr1')) document.getElementById('prof-addr1').value = user.addr1 || '';
            if (document.getElementById('prof-city')) document.getElementById('prof-city').value = user.city || '';
            if (document.getElementById('prof-state')) document.getElementById('prof-state').value = user.state || '';
            if (document.getElementById('prof-zip')) document.getElementById('prof-zip').value = user.zip || '';
            if (document.getElementById('prof-country')) document.getElementById('prof-country').value = user.country || 'Malaysia';
        }
    }

    if (currentFile === 'cart.html') window.renderCart();

    if (currentFile === 'checkout.html') {
        if (localCart.length === 0) { window.showToast('Your cart is empty!', 'error'); setTimeout(() => { window.location.href = 'cart.html'; }, 600); return; }
        let subtotal = 0;
        localCart.forEach(i => { const prod = localProducts.find(p => p.id === i.id); if (prod) i.price = prod.price; else if (i.price === undefined) i.price = 0; subtotal += i.price * i.quantity; });
        window.saveCart();
        if (document.getElementById('checkout-total-display')) document.getElementById('checkout-total-display').innerText = `RM${(subtotal * 1.06).toFixed(2)}`;
    }

    if (currentFile === 'dashboard.html') {
        const userId = parseInt(localStorage.getItem('loggedInUserId'));
        const custOrders = localOrders.filter(o => o.user_id === userId);
        const tbody = document.getElementById('customer-orders-tbody');
        if (tbody) {
            if (custOrders.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center">No orders yet.</td></tr>';
            else tbody.innerHTML = [...custOrders].reverse().map(o => `<tr><td>#${o.id}</td><td>${escapeHtml(formatOrderDate(o.date))}</td><td>RM${o.total.toFixed(2)}</td><td>${escapeHtml(o.status)}</td></tr>`).join('');
        }
    }

    if (currentFile === 'admin-dashboard.html') {
        const today = new Date(); let rev = 0; let count = 0;
        localOrders.forEach(o => { const d = new Date(o.date); if (!isNaN(d.getTime()) && d.toDateString() === today.toDateString()) rev += o.total; if (o.status !== 'Delivered' && o.status !== 'Cancelled') count++; });
        if (document.getElementById('admin-total-sales')) document.getElementById('admin-total-sales').innerText = `RM${rev.toFixed(2)}`;
        if (document.getElementById('admin-total-orders')) document.getElementById('admin-total-orders').innerText = count;
    }

    if (currentFile === 'sales-report.html') window.updateChart();
    if (currentFile === 'comments.html') window.renderComments();
});

// --- ADMIN GLOBAL FUNCTIONS (ASYNC UPDATE) ---
window.updateUserRole = async (id, role) => {
    const u = localUsers.find(x => x.id === id);
    if (!u) return;
    if (u.role === 'admin' && role === 'customer' && localUsers.filter(x => x.role === 'admin').length <= 1) { window.renderAdminUsers(); return window.showToast('Cannot demote the last admin account.', 'error'); }
    await apiCall('updateUserRole', { id, role }); window.showToast('Role updated successfully.'); await fetchStoreData(); window.renderAdminUsers();
};

window.deleteUser = async (id) => {
    const target = localUsers.find(x => x.id === id); if (!target) return;
    if (target.role === 'admin' && localUsers.filter(x => x.role === 'admin').length <= 1) return window.showToast('Cannot delete the last admin account.', 'error');
    if (!confirm('Are you sure you want to delete this user?')) return;
    await apiCall('deleteUser', { id }); window.showToast('User deleted.', 'error'); await fetchStoreData(); window.renderAdminUsers();
};

window.adminAddCategory = async (e) => {
    e.preventDefault(); const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return window.showToast('Category name is required.', 'error');
    if (localCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) return window.showToast('Category already exists!', 'error');
    await apiCall('addCategory', { name });
    document.getElementById('new-cat-name').value = ''; window.showToast('Category added successfully.'); await fetchStoreData(); window.renderAdminCategories();
};

window.deleteCategory = async (id) => {
    if (!confirm(`Are you sure you want to delete this category?`)) return;
    await apiCall('deleteCategory', { id }); window.showToast('Category deleted.', 'error'); await fetchStoreData(); window.renderAdminCategories(); window.renderAdminProducts();
};

window.openEditProductModal = (id) => {
    const p = localProducts.find(x => x.id === id); if (!p) return;
    document.getElementById('edit-prod-id').value = p.id; document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-price').value = p.price; document.getElementById('edit-prod-stock').value = p.stock || 0;
    document.getElementById('edit-prod-desc').value = p.description || '';
    document.getElementById('edit-prod-cat').innerHTML = localCategories.map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    document.getElementById('edit-product-modal').style.display = 'flex';
};

window.saveProductEdit = async (event) => {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-prod-id').value); const price = parseFloat(document.getElementById('edit-prod-price').value); const stock = parseInt(document.getElementById('edit-prod-stock').value, 10);
    const validationError = validateProductFields(price, stock); if (validationError) return window.showToast(validationError, 'error');
    const productData = { id, name: document.getElementById('edit-prod-name').value.trim(), price, stock, category_id: parseInt(document.getElementById('edit-prod-cat').value), desc: document.getElementById('edit-prod-desc').value.trim() };
    await apiCall('updateProduct', { product: productData }); window.showToast('Product updated successfully!');
    document.getElementById('edit-product-modal').style.display = 'none'; await fetchStoreData(); window.renderAdminProducts();
};

window.adminAddProduct = async (e) => {
    e.preventDefault();
    const price = parseFloat(document.getElementById('add-prod-price').value); const stock = parseInt(document.getElementById('add-prod-stock').value, 10);
    const validationError = validateProductFields(price, stock); if (validationError) return window.showToast(validationError, 'error');
    const newProd = { name: document.getElementById('add-prod-name').value.trim(), price, stock, category_id: parseInt(document.getElementById('add-prod-cat').value), desc: document.getElementById('add-prod-desc').value.trim() };
    await apiCall('addProduct', { product: newProd }); document.getElementById('add-product-modal').style.display = 'none'; e.target.reset(); window.showToast('Product added successfully.'); await fetchStoreData(); window.renderAdminProducts();
};

window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await apiCall('deleteProduct', { id }); window.showToast('Product deleted.', 'error'); await fetchStoreData(); window.renderAdminProducts();
};

window.updateOrderStatus = async (id, status) => { await apiCall('updateOrderStatus', { id, status }); window.showToast('Order status updated.'); await fetchStoreData(); window.renderAdminOrders(); };
window.deleteOrder = async (id) => { if (!confirm('Are you sure you want to delete this order?')) return; await apiCall('deleteOrder', { id }); window.showToast('Order deleted.', 'error'); await fetchStoreData(); window.renderAdminOrders(); };