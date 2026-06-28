// --- UTILITIES ---
const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const safeParse = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        localStorage.removeItem(key);
        return fallback;
    }
};

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';

window.handleImageError = (img, placeholder = PLACEHOLDER_IMAGE) => {
    img.onerror = null;
    img.src = placeholder;
};

const formatOrderDate = (dateValue) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const reloadStoreData = () => {
    localUsers = safeParse('storeUsers', []);
    localProducts = safeParse('storeProducts', []);
    localCategories = safeParse('storeCategories', []);
    localOrders = safeParse('storeOrders', []);
    localCart = safeParse('storeCart', []);
    localComments = safeParse('storeComments', []);
};

// --- LOCAL DATA INITIALIZATION ---
let localUsers = safeParse('storeUsers', []);
let localProducts = safeParse('storeProducts', []);
let localCategories = safeParse('storeCategories', []);
let localOrders = safeParse('storeOrders', []);
let localCart = safeParse('storeCart', []);
let localComments = safeParse('storeComments', []);

if (!localUsers.find(u => u.email === 'admin@system.com')) {
    localUsers.push({ id: 'u_admin', email: 'admin@system.com', password: 'admin123', role: 'admin', firstName: 'Admin', lastName: 'System' });
    localUsers.push({ id: 'u_cust', email: 'customer@example.com', password: 'password123', role: 'customer', firstName: 'Test', lastName: 'Customer' });
    localStorage.setItem('storeUsers', JSON.stringify(localUsers));
}

const seedLocalDatabase = () => {
    if (localStorage.getItem('localSeeded') === 'true' && localProducts.length >= 12) return;

    localStorage.setItem('localSeeded', 'true');
    localCategories = [
        { id: 'c1', name: 'Geckos', desc: 'Live captive-bred reptiles.' },
        { id: 'c2', name: 'Enclosures', desc: 'Habitats, tanks, and terrarium supplies.' },
        { id: 'c3', name: 'Food', desc: 'Live insects and formulated powdered diets.' }
    ];
    localProducts = [
        { id: 'p1', name: 'Leopard Gecko (Tangerine Morph)', price: 200, stock: 12, category: 'Geckos', desc: 'A healthy, captive-bred Leopard Gecko. Perfect for beginners.', image: 'img/Leopard_Gecko.jpeg' },
        { id: 'p2', name: 'Crested Gecko (Harlequin)', price: 160, stock: 5, category: 'Geckos', desc: 'Beautiful arboreal gecko with striking patterns.', image: 'img/Crested_Gecko.jpeg' },
        { id: 'p3', name: 'Gargoyle Gecko (Striped)', price: 700, stock: 3, category: 'Geckos', desc: 'Hardy and stunning striped gecko.', image: 'img/Gargoyle_Gecko.jpeg' },
        { id: 'p4', name: 'African Fat-Tailed Gecko', price: 300, stock: 6, category: 'Geckos', desc: 'Docile and friendly terrestrial gecko.', image: 'img/African_Fat_Tailed_Gecko.jpeg' },
        { id: 'p5', name: 'Premium Glass Terrarium', price: 150, stock: 8, category: 'Enclosures', desc: 'Spacious 75-liter front-opening glass terrarium.', image: 'img/Premium_Glass_Terrarium.jpeg' },
        { id: 'p6', name: 'Tall Arboreal Enclosure', price: 120, stock: 4, category: 'Enclosures', desc: 'Perfectly sized for climbing species.', image: 'img/Tall_Arboreal_Enclosure.jpeg' },
        { id: 'p7', name: 'Digital Thermometer & Hygrometer', price: 58.88, stock: 45, category: 'Enclosures', desc: 'Accurately monitor temperature and humidity.', image: 'img/Digital_Thermometer_and_Hygrometer.jpeg' },
        { id: 'p8', name: 'Natural Cork Bark Tubes', price: 25, stock: 35, category: 'Enclosures', desc: 'Provides a secure hiding spot.', image: 'img/Natural_Cork_Bark_Tubes.jpeg' },
        { id: 'p9', name: 'Live Mealworms (500-Count)', price: 10, stock: 50, category: 'Food', desc: 'Nutritious live mealworms.', image: 'img/Live_Mealworms.jpeg' },
        { id: 'p10', name: 'Live Dubia Roaches (200-Count)', price: 45, stock: 15, category: 'Food', desc: 'High-protein, low-chitin feeder insects.', image: 'img/Live_Dubia_Roaches.jpeg' },
        { id: 'p11', name: 'Crested Gecko Diet (Watermelon)', price: 75.99, stock: 30, category: 'Food', desc: 'Complete meal replacement powder.', image: 'img/Crested_Gecko_Diet.jpeg' },
        { id: 'p12', name: 'Calcium + D3 Supplement', price: 89.99, stock: 100, category: 'Food', desc: 'Essential vitamin powder.', image: 'img/Calcium_and_D3_Supplement.jpeg' }
    ];
    localStorage.setItem('storeCategories', JSON.stringify(localCategories));
    localStorage.setItem('storeProducts', JSON.stringify(localProducts));
};
seedLocalDatabase();

window.saveCart = () => localStorage.setItem('storeCart', JSON.stringify(localCart));

// --- TOAST ALERTS ---
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    const closeBtn = document.createElement('strong');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'cursor:pointer; margin-left:10px;';
    closeBtn.onclick = () => toast.remove();
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- AUTHENTICATION & SECURITY ROUTING ---
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
        msg.textContent = '';
        saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer';
    }
};

window.handleRegister = (event) => {
    event.preventDefault();
    const email = document.getElementById('reg-email').value.toLowerCase().trim();
    if (localUsers.find(u => u.email === email)) return window.showToast('Email already registered!', 'error');

    localUsers.push({
        id: 'u_' + Date.now(), email,
        password: document.getElementById('reg-pass').value, role: 'customer',
        firstName: document.getElementById('reg-fname').value.trim(),
        lastName: document.getElementById('reg-lname').value.trim()
    });
    localStorage.setItem('storeUsers', JSON.stringify(localUsers));
    window.showToast('Registration successful!');
    setTimeout(() => { window.location.href = 'login.html'; }, 800);
};

window.handleUnifiedLogin = (event) => {
    event.preventDefault();
    reloadStoreData();
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    const user = localUsers.find(u => u.email === email && u.password === pass);

    if (user) {
        localStorage.setItem('loggedInEmail', email);
        if (user.role === 'admin') {
            localStorage.setItem('isAdmin', 'true'); localStorage.setItem('isCustomer', 'false');
            window.location.href = 'admin-dashboard.html';
        } else {
            localStorage.setItem('isAdmin', 'false'); localStorage.setItem('isCustomer', 'true');
            window.location.href = 'dashboard.html';
        }
    } else window.showToast('Invalid email or password.', 'error');
};

window.handleLogout = () => {
    localStorage.setItem('isAdmin', 'false'); localStorage.setItem('isCustomer', 'false');
    localStorage.removeItem('loggedInEmail');
    window.location.href = 'index.html';
};

window.handleUpdateProfile = (event) => {
    event.preventDefault();
    reloadStoreData();
    const updatePayload = {
        firstName: document.getElementById('prof-fname').value.trim(),
        lastName: document.getElementById('prof-lname').value.trim(),
        phoneExt: document.getElementById('prof-phone-ext').value,
        phone: document.getElementById('prof-phone').value,
        addr1: document.getElementById('prof-addr1').value,
        city: document.getElementById('prof-city').value,
        state: document.getElementById('prof-state').value,
        zip: document.getElementById('prof-zip').value,
        country: document.getElementById('prof-country').value
    };

    const currentPass = document.getElementById('prof-current-pass').value;
    const newPass = document.getElementById('prof-new-pass').value;
    const confirmPass = document.getElementById('prof-confirm-pass').value;

    const userEmail = localStorage.getItem('loggedInEmail');
    const userDoc = localUsers.find(u => u.email === userEmail);

    if (!userDoc) return window.showToast('Session expired. Please log in again.', 'error');

    if (currentPass || newPass || confirmPass) {
        if (!currentPass || !newPass || !confirmPass) return window.showToast('Please fill out all 3 password fields to change it.', 'error');
        if (newPass !== confirmPass) return window.showToast('Your new passwords do not match.', 'error');
        if (userDoc.password !== currentPass) return window.showToast('Your current password is incorrect.', 'error');
        updatePayload.password = newPass;
    }

    Object.assign(userDoc, updatePayload);
    localStorage.setItem('storeUsers', JSON.stringify(localUsers));
    window.showToast('Profile successfully updated.', 'success');

    document.getElementById('prof-current-pass').value = '';
    document.getElementById('prof-new-pass').value = '';
    document.getElementById('prof-confirm-pass').value = '';
    setTimeout(() => {
        window.location.href = localStorage.getItem('isAdmin') === 'true' ? 'admin-dashboard.html' : 'dashboard.html';
    }, 800);
};

// --- DATA RENDERING FUNCTIONS ---
window.renderProducts = () => {
    reloadStoreData();
    const container = document.getElementById('products-grid');
    if (!container) return;
    const search = (document.getElementById('search-prod')?.value || '').toLowerCase();
    const cat = document.getElementById('filter-cat')?.value || '';

    let filtered = localProducts.filter(p => p.name.toLowerCase().includes(search) && (cat === '' || p.category === cat));
    if (filtered.length === 0) { container.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No products found.</p>'; return; }

    container.innerHTML = filtered.map(p => `
        <div class="card">
            <img src="${escapeHtml(p.image || PLACEHOLDER_IMAGE)}" alt="${escapeHtml(p.name)}" class="card-img" style="object-fit: cover;" onerror="window.handleImageError(this)">
            <div class="card-body">
                <h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.desc)}</p><div class="price">RM${p.price.toFixed(2)}</div>
                <div class="qty-stepper" style="margin-top:1rem; margin-bottom: 0.5rem;">
                    <button type="button" class="qty-btn" onclick="window.decreaseQty('qty-${escapeHtml(p.id)}')">−</button>
                    <input type="number" id="qty-${escapeHtml(p.id)}" value="1" readonly>
                    <button type="button" class="qty-btn" onclick="window.increaseQty('qty-${escapeHtml(p.id)}', ${p.stock})">+</button>
                </div>
                <button type="button" onclick="window.goToDetails('${escapeHtml(p.id)}')" class="btn btn-outline" style="width:100%; margin-bottom:0.5rem;">View Details</button>
                <button type="button" onclick="window.addToCart('${escapeHtml(p.id)}')" class="btn" style="width:100%">Add to Cart</button>
            </div>
        </div>
    `).join('');
};

window.goToDetails = (id) => {
    localStorage.setItem('viewingProductId', id);
    window.location.href = 'product-detail.html';
};

window.decreaseQty = (id) => { const el = document.getElementById(id); if (el && parseInt(el.value) > 1) el.value = parseInt(el.value) - 1; };
window.increaseQty = (id, max) => { const el = document.getElementById(id); if (el && parseInt(el.value) < max) el.value = parseInt(el.value) + 1; };

window.addToCart = (id, specificQty) => {
    if (localStorage.getItem('isCustomer') !== 'true' && localStorage.getItem('isAdmin') !== 'true') return window.location.href = 'login.html';
    reloadStoreData();
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
    reloadStoreData();
    const item = localCart.find(i => i.id === id);
    const prod = localProducts.find(p => p.id === id);
    if (item && prod) {
        if (newQty < 1) return;
        if (newQty > prod.stock) { window.showToast(`Max stock is ${prod.stock}.`, 'error'); item.quantity = prod.stock; }
        else item.quantity = newQty;
        item.price = prod.price;
        window.saveCart(); window.renderCart();
    }
};

window.removeFromCart = (id) => {
    localCart = localCart.filter(i => i.id !== id); window.saveCart(); window.renderCart(); window.showToast('Item removed.');
};

window.renderCart = () => {
    reloadStoreData();
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    let html = ''; let subtotal = 0;
    if (localCart.length === 0) {
        html = `<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>`;
    } else {
        localCart.forEach((item) => {
            const prod = localProducts.find(p => p.id === item.id);
            if (prod) item.price = prod.price;
            const itemTotal = item.price * item.quantity; subtotal += itemTotal;
            html += `<tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td><div class="qty-stepper"><button class="qty-btn" onclick="window.updateCartQuantity('${escapeHtml(item.id)}', ${item.quantity - 1})">−</button><input type="number" value="${item.quantity}" readonly><button class="qty-btn" onclick="window.updateCartQuantity('${escapeHtml(item.id)}', ${item.quantity + 1})">+</button></div></td>
                <td>RM${item.price.toFixed(2)}</td><td>RM${itemTotal.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="window.removeFromCart('${escapeHtml(item.id)}')">Remove</button></td>
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

window.formatCardNumber = (input) => {
    let val = input.value.replace(/\D/g, '');
    input.value = (val.match(/.{1,4}/g)?.join(' ') || val).substring(0, 19);
};

// --- CHECKOUT LOGIC ---
window.handleCheckout = (event) => {
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

    reloadStoreData();

    for (const item of localCart) {
        const prod = localProducts.find(p => p.id === item.id);
        if (!prod) return window.showToast(`"${item.name}" is no longer available.`, 'error');
        if (item.quantity > prod.stock) return window.showToast(`Only ${prod.stock} of "${prod.name}" in stock.`, 'error');
        item.price = prod.price;
    }

    let subtotal = 0;
    localCart.forEach(item => { subtotal += item.price * item.quantity; });
    const finalTotal = subtotal + (subtotal * 0.06);

    const currentUserEmail = localStorage.getItem('loggedInEmail');
    if (!currentUserEmail) return window.location.href = 'login.html';

    const newOrder = {
        id: 'ord' + Date.now(),
        email: currentUserEmail,
        date: new Date().toISOString(),
        total: finalTotal,
        status: 'Processing',
        items: localCart.map(i => ({ ...i })),
        paymentName: fullName
    };

    localCart.forEach(item => {
        const prod = localProducts.find(p => p.id === item.id);
        if (prod) prod.stock -= item.quantity;
    });
    localStorage.setItem('storeProducts', JSON.stringify(localProducts));

    localOrders.push(newOrder);
    localStorage.setItem('storeOrders', JSON.stringify(localOrders));

    localCart = [];
    window.saveCart();
    window.showToast('Payment Successful! Order saved successfully.');

    setTimeout(() => {
        window.location.href = localStorage.getItem('isAdmin') === 'true' ? 'admin-dashboard.html' : 'dashboard.html';
    }, 800);
};

// --- COMMENTS ---
window.handleSubmitComment = (event) => {
    event.preventDefault();
    const productId = localStorage.getItem('viewingProductId');
    if (!productId) return window.showToast('No product selected for review.', 'error');

    const title = document.getElementById('comment-title')?.value?.trim();
    const body = document.getElementById('comment-body')?.value?.trim();
    if (!title || !body) return window.showToast('Please fill in all review fields.', 'error');

    localComments.push({
        id: 'cm_' + Date.now(),
        productId,
        title,
        body,
        email: localStorage.getItem('loggedInEmail') || 'Anonymous',
        date: new Date().toISOString()
    });
    localStorage.setItem('storeComments', JSON.stringify(localComments));
    document.getElementById('comment-title').value = '';
    document.getElementById('comment-body').value = '';
    window.showToast('Review submitted!');
    window.renderComments();
};

window.renderComments = () => {
    reloadStoreData();
    const productId = localStorage.getItem('viewingProductId');
    const product = localProducts.find(p => p.id === productId);
    const titleEl = document.getElementById('comments-product-name');
    const listEl = document.getElementById('comments-list');

    if (titleEl) {
        titleEl.textContent = product ? `Reviews for ${product.name}` : 'Product Reviews';
    }

    if (!listEl) return;

    const reviews = localComments.filter(c => c.productId === productId);
    if (reviews.length === 0) {
        listEl.innerHTML = '<p class="text-center">No reviews yet. Be the first!</p>';
        return;
    }

    listEl.innerHTML = reviews.map(c => `
        <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
            <h3 style="margin-bottom: 0.25rem;">${escapeHtml(c.title)}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${escapeHtml(formatOrderDate(c.date))} · ${escapeHtml(c.email)}</p>
            <p style="margin-bottom: 0;">${escapeHtml(c.body)}</p>
        </div>
    `).join('');
};

// --- CHART LOGIC ---
window.salesChartInstance = null;
window.updateChart = () => {
    const ctx = document.getElementById('salesChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (window.salesChartInstance) window.salesChartInstance.destroy();

    reloadStoreData();
    const monthSelect = document.getElementById('report-month');
    const selectedMonth = monthSelect ? monthSelect.value : 'all';
    const currentYear = new Date().getFullYear();

    let labels = [];
    let data = [];

    if (selectedMonth === 'all') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const rev = new Array(12).fill(0);
        localOrders.forEach(o => {
            const d = new Date(o.date);
            if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) rev[d.getMonth()] += o.total;
        });
        const curr = new Date().getMonth();
        for (let i = 5; i >= 0; i--) {
            let m = curr - i; if (m < 0) m += 12;
            labels.push(months[m]); data.push(rev[m]);
        }
    } else {
        const targetMonth = parseInt(selectedMonth);
        const daysInMonth = new Date(currentYear, targetMonth + 1, 0).getDate();
        const rev = new Array(daysInMonth).fill(0);
        localOrders.forEach(o => {
            const d = new Date(o.date);
            if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === targetMonth) {
                rev[d.getDate() - 1] += o.total;
            }
        });
        for (let i = 1; i <= daysInMonth; i++) {
            labels.push(`Day ${i}`); data.push(rev[i - 1]);
        }
    }

    window.salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Revenue (RM)', data: data, backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
};

// --- MODULAR ADMIN RENDERERS ---
window.renderAdminUsers = () => {
    reloadStoreData();
    const adminTbody = document.getElementById('admin-admins-tbody');
    const custTbody = document.getElementById('admin-customers-tbody');
    if (!adminTbody && !custTbody) return;

    const render = (list, tbody) => {
        if (!tbody) return;
        if (list.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center">No users found.</td></tr>';
        else tbody.innerHTML = list.map(u => `<tr><td>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</td><td>${escapeHtml(u.email)}</td><td>
            <select onchange="window.updateUserRole('${escapeHtml(u.id)}', this.value)" style="padding: 0.2rem;"><option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option></select>
            </td><td><button class="btn btn-danger" onclick="window.deleteUser('${escapeHtml(u.id)}')">Del</button></td></tr>`).join('');
    };
    render(localUsers.filter(u => u.role === 'admin'), adminTbody);
    render(localUsers.filter(u => u.role === 'customer'), custTbody);
};

window.renderAdminCategories = () => {
    reloadStoreData();
    const tbody = document.getElementById('admin-category-tbody');
    if (!tbody) return;
    tbody.innerHTML = localCategories.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${localProducts.filter(p => p.category === c.name).length}</td><td><button class="btn btn-danger" onclick="window.deleteCategory('${escapeHtml(c.id)}')">Del</button></td></tr>`).join('');
};

window.renderAdminProducts = () => {
    reloadStoreData();
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    tbody.innerHTML = localProducts.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>RM${p.price.toFixed(2)}</td><td>${p.stock}</td><td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; margin-right: 0.5rem;" onclick="window.openEditProductModal('${escapeHtml(p.id)}')">Edit</button><button class="btn btn-danger" style="padding: 0.2rem 0.5rem;" onclick="window.deleteProduct('${escapeHtml(p.id)}')">Del</button></td></tr>`).join('');

    const catDrop = document.getElementById('add-prod-cat');
    if (catDrop) catDrop.innerHTML = localCategories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
};

window.renderAdminOrders = () => {
    reloadStoreData();
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = localOrders.map(o => `<tr><td>#${escapeHtml(o.id.slice(0, 6).toUpperCase())}</td><td>${escapeHtml(o.email)}</td><td>RM${o.total.toFixed(2)}</td><td>
        <select onchange="window.updateOrderStatus('${escapeHtml(o.id)}', this.value)" style="padding: 0.2rem;"><option ${o.status === 'Processing' ? 'selected' : ''}>Processing</option><option ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option><option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option><option ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select>
        </td><td><button class="btn btn-danger" onclick="window.deleteOrder('${escapeHtml(o.id)}')">Del</button></td></tr>`).join('');
};

const validateProductFields = (price, stock) => {
    if (isNaN(price) || price < 0) return 'Price must be a non-negative number.';
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) return 'Stock must be a non-negative whole number.';
    return null;
};

// --- INITIALIZE PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    window.checkVisualAuthState();

    document.querySelectorAll('nav ul li a').forEach(link => {
        if (link.getAttribute('href') === currentFile || (currentFile === '' && link.getAttribute('href') === 'index.html')) link.classList.add('active-nav-link');
    });

    window.renderAdminUsers();
    window.renderAdminCategories();
    window.renderAdminProducts();
    window.renderAdminOrders();

    if (currentFile === 'products.html') {
        const filterCat = document.getElementById('filter-cat');
        if (filterCat) filterCat.innerHTML = '<option value="">All Categories</option>' + localCategories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
        window.renderProducts();
    }

    if (currentFile === 'product-detail.html') {
        reloadStoreData();
        const id = localStorage.getItem('viewingProductId');
        const p = localProducts.find(x => x.id === id);
        if (!p) {
            document.getElementById('detail-name').innerText = 'Product not found';
            document.getElementById('detail-desc').innerHTML = '<p>This product may have been removed. <a href="products.html">Return to catalog</a>.</p>';
            const addBtn = document.getElementById('detail-add-btn');
            if (addBtn) addBtn.disabled = true;
        } else {
            document.getElementById('detail-name').innerText = p.name;
            document.getElementById('detail-price').innerText = 'RM' + p.price.toFixed(2);
            document.getElementById('detail-stock-count').innerText = p.stock || 0;
            document.getElementById('detail-desc').innerHTML = `<p>${escapeHtml(p.desc)}</p>`;
            if (document.getElementById('detail-image')) {
                const imgEl = document.getElementById('detail-image');
                imgEl.src = p.image || PLACEHOLDER_IMAGE;
                imgEl.onerror = () => window.handleImageError(imgEl);
            }

            const qtyInput = document.getElementById('detail-qty');
            qtyInput.max = p.stock;
            const incBtn = document.getElementById('detail-qty-inc');
            if (incBtn) incBtn.onclick = () => window.increaseQty('detail-qty', p.stock);
            document.getElementById('detail-add-btn').onclick = () => window.addToCart(p.id, parseInt(document.getElementById('detail-qty').value));
            if (p.stock < 1) document.getElementById('detail-add-btn').disabled = true;
        }
    }

    if (currentFile === 'profile.html') {
        const emailInput = document.getElementById('prof-email');
        if (emailInput) emailInput.value = localStorage.getItem('loggedInEmail') || '';
        const user = localUsers.find(u => u.email === localStorage.getItem('loggedInEmail'));
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
        reloadStoreData();
        if (localCart.length === 0) {
            window.showToast('Your cart is empty!', 'error');
            setTimeout(() => { window.location.href = 'cart.html'; }, 600);
            return;
        }
        let subtotal = 0;
        localCart.forEach(i => {
            const prod = localProducts.find(p => p.id === i.id);
            if (prod) i.price = prod.price;
            subtotal += i.price * i.quantity;
        });
        window.saveCart();
        if (document.getElementById('checkout-total-display')) document.getElementById('checkout-total-display').innerText = `RM${(subtotal * 1.06).toFixed(2)}`;
    }

    if (currentFile === 'dashboard.html') {
        reloadStoreData();
        const userEmail = localStorage.getItem('loggedInEmail');
        const custOrders = localOrders.filter(o => o.email === userEmail);
        const tbody = document.getElementById('customer-orders-tbody');
        if (tbody) {
            if (custOrders.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center">No orders yet.</td></tr>';
            else tbody.innerHTML = [...custOrders].reverse().map(o => `<tr><td>#${escapeHtml(o.id.slice(0, 6).toUpperCase())}</td><td>${escapeHtml(formatOrderDate(o.date))}</td><td>RM${o.total.toFixed(2)}</td><td>${escapeHtml(o.status)}</td></tr>`).join('');
        }
    }

    if (currentFile === 'admin-dashboard.html') {
        reloadStoreData();
        const today = new Date();
        let rev = 0; let count = 0;
        localOrders.forEach(o => {
            const d = new Date(o.date);
            if (!isNaN(d.getTime()) && d.toDateString() === today.toDateString()) rev += o.total;
            if (o.status !== 'Delivered' && o.status !== 'Cancelled') count++;
        });
        if (document.getElementById('admin-total-sales')) document.getElementById('admin-total-sales').innerText = `RM${rev.toFixed(2)}`;
        if (document.getElementById('admin-total-orders')) document.getElementById('admin-total-orders').innerText = count;
    }

    if (currentFile === 'sales-report.html') {
        window.updateChart();
    }

    if (currentFile === 'comments.html') {
        window.renderComments();
    }
});

// Admin Global Functions
window.updateUserRole = (id, role) => {
    reloadStoreData();
    const u = localUsers.find(x => x.id === id);
    if (!u) return;
    if (u.role === 'admin' && role === 'customer' && localUsers.filter(x => x.role === 'admin').length <= 1) {
        window.renderAdminUsers();
        return window.showToast('Cannot demote the last admin account.', 'error');
    }
    u.role = role;
    localStorage.setItem('storeUsers', JSON.stringify(localUsers));
    window.showToast('Role updated successfully.');
    window.renderAdminUsers();
};

window.deleteUser = (id) => {
    reloadStoreData();
    const target = localUsers.find(x => x.id === id);
    if (!target) return;
    if (target.role === 'admin' && localUsers.filter(x => x.role === 'admin').length <= 1) {
        return window.showToast('Cannot delete the last admin account.', 'error');
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    localUsers = localUsers.filter(x => x.id !== id);
    localStorage.setItem('storeUsers', JSON.stringify(localUsers));
    window.showToast('User deleted.', 'error');
    window.renderAdminUsers();
};

window.adminAddCategory = (e) => {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return window.showToast('Category name is required.', 'error');
    if (localCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) return window.showToast('Category already exists!', 'error');
    localCategories.push({ id: 'c' + Date.now(), name });
    localStorage.setItem('storeCategories', JSON.stringify(localCategories));
    document.getElementById('new-cat-name').value = '';
    window.showToast('Category added successfully.');
    window.renderAdminCategories();
};

window.deleteCategory = (id) => {
    reloadStoreData();
    const cat = localCategories.find(c => c.id === id);
    if (!cat) return;
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    if (!localCategories.find(c => c.name === 'General')) {
        localCategories.push({ id: 'c_general', name: 'General', desc: 'Uncategorized products.' });
    }
    localProducts.forEach(p => { if (p.category === cat.name) p.category = 'General'; });
    localStorage.setItem('storeProducts', JSON.stringify(localProducts));
    localCategories = localCategories.filter(c => c.id !== id);
    localStorage.setItem('storeCategories', JSON.stringify(localCategories));
    window.showToast('Category deleted.', 'error');
    window.renderAdminCategories();
    window.renderAdminProducts();
};

window.openEditProductModal = (id) => {
    reloadStoreData();
    const p = localProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-price').value = p.price;
    document.getElementById('edit-prod-stock').value = p.stock || 0;
    document.getElementById('edit-prod-desc').value = p.desc || '';
    document.getElementById('edit-prod-cat').innerHTML = localCategories.map(c => `<option value="${escapeHtml(c.name)}" ${c.name === p.category ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    document.getElementById('edit-product-modal').style.display = 'flex';
};

window.saveProductEdit = (event) => {
    event.preventDefault();
    const id = document.getElementById('edit-prod-id').value;
    const price = parseFloat(document.getElementById('edit-prod-price').value);
    const stock = parseInt(document.getElementById('edit-prod-stock').value, 10);
    const validationError = validateProductFields(price, stock);
    if (validationError) return window.showToast(validationError, 'error');

    const prod = localProducts.find(p => p.id === id);
    if (prod) {
        prod.name = document.getElementById('edit-prod-name').value.trim();
        prod.price = price;
        prod.stock = stock;
        prod.category = document.getElementById('edit-prod-cat').value;
        prod.desc = document.getElementById('edit-prod-desc').value.trim();
        localStorage.setItem('storeProducts', JSON.stringify(localProducts));
        window.showToast('Product updated successfully!');
        window.renderAdminProducts();
    }
    document.getElementById('edit-product-modal').style.display = 'none';
};

window.adminAddProduct = (e) => {
    e.preventDefault();
    const price = parseFloat(document.getElementById('add-prod-price').value);
    const stock = parseInt(document.getElementById('add-prod-stock').value, 10);
    const validationError = validateProductFields(price, stock);
    if (validationError) return window.showToast(validationError, 'error');

    localProducts.push({
        id: 'p' + Date.now(),
        name: document.getElementById('add-prod-name').value.trim(),
        price,
        stock,
        category: document.getElementById('add-prod-cat').value,
        desc: document.getElementById('add-prod-desc').value.trim()
    });
    localStorage.setItem('storeProducts', JSON.stringify(localProducts));
    document.getElementById('add-product-modal').style.display = 'none';
    e.target.reset();
    window.showToast('Product added successfully.');
    window.renderAdminProducts();
};

window.deleteProduct = (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    reloadStoreData();
    localProducts = localProducts.filter(x => x.id !== id);
    localStorage.setItem('storeProducts', JSON.stringify(localProducts));
    window.showToast('Product deleted.', 'error');
    window.renderAdminProducts();
};

window.updateOrderStatus = (id, status) => {
    reloadStoreData();
    const o = localOrders.find(x => x.id === id);
    if (o) o.status = status;
    localStorage.setItem('storeOrders', JSON.stringify(localOrders));
    window.showToast('Order status updated.');
    window.renderAdminOrders();
};

window.deleteOrder = (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    reloadStoreData();
    localOrders = localOrders.filter(x => x.id !== id);
    localStorage.setItem('storeOrders', JSON.stringify(localOrders));
    window.showToast('Order deleted.', 'error');
    window.renderAdminOrders();
};
