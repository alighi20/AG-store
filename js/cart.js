// گرفتن سبد از localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// ذخیره سبد
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// اضافه کردن محصول
function addToCart(product) {
    console.log("ADD TO CART WORKED");
    let cart = getCart();

    let existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    updateCartUI();
}

// حذف محصول
function removeFromCart(id) {
    let cart = getCart().filter(item => item.id !== id);
    saveCart(cart);
    updateCartUI();
}

// آپدیت UI
function updateCartUI() {
    const cart = getCart();
    const container = document.getElementById("cart-items");

    if (!container) return;

    container.innerHTML = "";

    cart.forEach(item => {
        container.innerHTML += `
            <div class="cart-item">
                <h4>${item.name}</h4>
                <p>Price: $${item.price}</p>
                <p>Qty: ${item.quantity}</p>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    });

    // جمع کل
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const totalBox = document.getElementById("cart-total");
    if (totalBox) totalBox.innerText = "Total: $" + total;
}
function addToCart(product) {
    let cart = getCart();

    let existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);

    updateCartCount(); // 👈 اینو اضافه کن
}
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    const el = document.getElementById("cart-count");
    if (el) el.innerText = count;
}
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});