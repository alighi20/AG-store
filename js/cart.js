function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce((sum, item) => {
        return sum + (Number(item.quantity) || 1);
    }, 0);

    const el1 = document.getElementById("cart-count");
    const el2 = document.getElementById("cartCount");

    if (el1) el1.innerText = count;
    if (el2) el2.innerText = count;
}
function addToCart(product) {
    console.log("ADD TO CART WORKED");

    let cart = getCart();

    let existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    updateCartCount();
}
function increaseQty(id) {
    let cart = getCart();

    cart = cart.map(item => {
        if (item.id === id) {
            item.quantity = (item.quantity || 1) + 1;
        }
        return item;
    });

    saveCart(cart);
    updateCartCount();
    renderCartPage();
}

function decreaseQty(id) {
    let cart = getCart();

    cart = cart.map(item => {
        if (item.id === id && item.quantity > 1) {
            item.quantity -= 1;
        }
        return item;
    });

    saveCart(cart);
    updateCartCount();
    renderCartPage();
}

function clearCart() {
    localStorage.removeItem("cart");
    updateCartCount();
    renderCartPage();
}
function removeFromCart(id) {
    let cart = getCart();

    cart = cart.filter(item => item.id !== id);

    saveCart(cart);
    updateCartCount();
    renderCartPage();
}
// 👇 اینجا اضافه کن
function renderCartPage() {
    const container = document.getElementById("app");

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = "<h3>سبد خرید خالی است 🛒</h3>";
        return;
    }

    let total = 0;

    container.innerHTML = cart.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itemTotal = qty * price;

        total += itemTotal;

        return `
            <div style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:10px;">
                <h5>${item.name}</h5>
                <p>قیمت: ${price.toLocaleString()} تومان</p>

                <div>
                    <button onclick="decreaseQty(${item.id})">➖</button>
                    <span style="margin:0 10px">${qty}</span>
                    <button onclick="increaseQty(${item.id})">➕</button>
                </div>

                <p>جمع: ${itemTotal.toLocaleString()} تومان</p>

                <button onclick="removeFromCart(${item.id})" style="color:red;">
                    حذف ❌
                </button>
            </div>
        `;
    }).join("") + `
        <hr>
        <h4>جمع کل: ${total.toLocaleString()} تومان</h4>
        <button onclick="clearCart()" style="background:red;color:white;padding:10px;border:none;border-radius:8px;">
            🗑️ پاک کردن سبد
        </button>
    `;
}

// 👇 اضافه کن آخر cart.js
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.clearCart = clearCart;