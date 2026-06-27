import { getState, setState } from "./store.js";
import { addToCart, removeFromCart, changeQty, cartCount, cartTotal, clearCart } from "./cart.js";
import { applyFilters, getProductById, loadProducts } from "./products.js";
import { login, logout } from "./auth.js";

export function showToast(message, type = "info") {
    const toast = document.getElementById("toastBox");
    toast.textContent = message;
    toast.className = `toast-box show ${type}`;

    setTimeout(() => {
        toast.className = "toast-box";
    }, 2500);
}

export function setStatus(text) {
    const status = document.getElementById("statusText");
    if (status) status.textContent = text;
}

export function updateCartCount() {
    const el = document.getElementById("cartCount");
    if (el) el.textContent = cartCount();
}

export function renderAuthState() {
    const { token } = getState();

    const guestBox = document.getElementById("guestBox");
    const userBox = document.getElementById("userBox");

    if (!guestBox || !userBox) return;

    if (token) {
        guestBox.classList.add("hidden");
        userBox.classList.remove("hidden");
    } else {
        guestBox.classList.remove("hidden");
        userBox.classList.add("hidden");
    }
}

function paginate(items) {
    const { currentPage, perPage } = getState();
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
}

export function renderPagination(items) {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    const { perPage, currentPage } = getState();
    const pageCount = Math.ceil(items.length / perPage);

    if (pageCount <= 1) {
        pagination.innerHTML = "";
        return;
    }

    let html = "";

    for (let i = 1; i <= pageCount; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    pagination.innerHTML = html;

    pagination.querySelectorAll(".page-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setState({ currentPage: Number(btn.dataset.page) });
            renderProducts(getState().filteredProducts);
        });
    });
}

export function renderProducts(products) {
    const app = document.getElementById("app");
    const pageTitle = document.getElementById("pageTitle");

    if (!app) return;

    pageTitle.textContent = "لیست محصولات";

    if (!products.length) {
        app.innerHTML = `<div class="empty-state">محصولی یافت نشد</div>`;
        renderPagination([]);
        return;
    }

    const items = paginate(products);

    app.innerHTML = `
        <div id="productGrid" class="product-grid">
            ${items.map(product => `
                <div class="product-card">
                    <img src="${product.imageUrl || "https://via.placeholder.com/200"}" alt="${product.title || "product"}">
                    <h4>${product.title || "بدون عنوان"}</h4>
                    <div class="price">${Number(product.price || 0).toLocaleString()} تومان</div>
                    <div class="product-actions">
                        <button class="add-btn" data-id="${product.id}">افزودن به سبد</button>
                        <a class="details-link" href="#/product/${product.id}">جزئیات</a>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    app.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const product = products.find(p => Number(p.id) === Number(btn.dataset.id));
            if (product) addToCart(product);
        });
    });

    renderPagination(products);
}

export function renderCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;

    const cart = getState().cart;

    drawer.innerHTML = `
        <div class="cart-drawer-header">
            <h3>سبد خرید</h3>
            <button id="closeCartDrawerBtn" class="icon-btn">×</button>
        </div>

        ${cart.length ? `
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <div>
                            <strong>${item.title}</strong>
                            <div>${Number(item.price).toLocaleString()} تومان</div>
                        </div>

                        <div class="cart-item-actions">
                            <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
                            <button class="remove-btn" data-id="${item.id}">حذف</button>
                        </div>
                    </div>
                `).join("")}
            </div>

            <div class="cart-summary">
                <div>تعداد: ${cartCount()}</div>
                <div>جمع کل: ${cartTotal().toLocaleString()} تومان</div>
                <button id="clearCartBtn" class="clear-btn">خالی کردن سبد</button>
                <a href="#/cart" id="goCartPageBtn" class="go-cart-link">رفتن به صفحه سبد</a>
            </div>
        ` : `
            <div class="empty-state">سبد خرید خالی است</div>
        `}
    `;

    const closeBtn = document.getElementById("closeCartDrawerBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => drawer.classList.add("hidden"));
    }

    drawer.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
    });

    drawer.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
        });
    });

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearCart);
    }
}

export function renderHomePage() {
    const { filteredProducts } = getState();
    renderProducts(filteredProducts);
}

export function renderCartPage() {
    const app = document.getElementById("app");
    const pageTitle = document.getElementById("pageTitle");
    const cart = getState().cart;

    pageTitle.textContent = "سبد خرید";

    if (!cart.length) {
        app.innerHTML = `<div class="empty-state">سبد خرید شما خالی است</div>`;
        return;
    }

    app.innerHTML = `
        <div class="cart-page">
            ${cart.map(item => `
                <div class="cart-page-item">
                    <div>
                        <h4>${item.title}</h4>
                        <div>${Number(item.price).toLocaleString()} تومان</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
                        <button class="remove-btn" data-id="${item.id}">حذف</button>
                    </div>
                </div>
            `).join("")}

            <div class="cart-page-summary">
                <strong>جمع کل: ${cartTotal().toLocaleString()} تومان</strong>
            </div>
        </div>
    `;

    app.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
    });

    app.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => changeQty(Number(btn.dataset.id), Number(btn.dataset.delta)));
    });
}

export function renderProductDetailsPage(id) {
    const app = document.getElementById("app");
    const pageTitle = document.getElementById("pageTitle");
    const product = getProductById(id);

    pageTitle.textContent = "جزئیات محصول";

    if (!product) {
        app.innerHTML = `<div class="empty-state">محصول پیدا نشد</div>`;
        return;
    }

    app.innerHTML = `
        <div class="product-details">
            <div class="product-details-image">
                <img src="${product.imageUrl || "https://via.placeholder.com/400"}" alt="${product.title}">
            </div>
            <div class="product-details-content">
                <h2>${product.title}</h2>
                <p>شناسه محصول: ${product.id}</p>
                <p class="price">${Number(product.price || 0).toLocaleString()} تومان</p>
                <button id="detailAddBtn" class="add-btn">افزودن به سبد</button>
                <a href="#/" class="back-link">بازگشت</a>
            </div>
        </div>
    `;

    document.getElementById("detailAddBtn").addEventListener("click", () => addToCart(product));
}

export function bindGlobalEvents() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const cartToggleBtn = document.getElementById("cartToggleBtn");
    const searchInput = document.getElementById("searchInput");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const sortSelect = document.getElementById("sortSelect");
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();
            login(username, password).then(() => loadProducts());
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener("click", () => {
            const drawer = document.getElementById("cartDrawer");
            renderCartDrawer();
            drawer.classList.toggle("hidden");
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            setState({ search: e.target.value });
            applyFilters();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            setState({
                filters: {
                    ...getState().filters,
                    sort: e.target.value
                }
            });
            applyFilters();
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            setState({
                filters: {
                    ...getState().filters,
                    minPrice: minPrice.value,
                    maxPrice: maxPrice.value
                }
            });
            applyFilters();
        });
    }
}
