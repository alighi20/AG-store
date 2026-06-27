import { getState, setState } from "./store.js";
import { showToast, updateCartCount, renderCartDrawer } from "./ui.js";

function persistCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    setState({ cart });
    updateCartCount();
    renderCartDrawer();
}

export function getCart() {
    return getState().cart;
}

export function addToCart(product) {
    const cart = [...getCart()];
    const found = cart.find(item => item.id === product.id);

    if (found) {
        found.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    persistCart(cart);
    showToast("محصول به سبد خرید اضافه شد", "success");
}

export function removeFromCart(id) {
    const cart = getCart().filter(item => item.id !== id);
    persistCart(cart);
    showToast("محصول حذف شد", "info");
}

export function changeQty(id, delta) {
    const cart = [...getCart()];
    const item = cart.find(i => i.id === id);

    if (!item) return;

    item.qty += delta;

    if (item.qty <= 0) {
        persistCart(cart.filter(i => i.id !== id));
        return;
    }

    persistCart(cart);
}

export function clearCart() {
    persistCart([]);
    showToast("سبد خرید خالی شد", "info");
}

export function cartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal() {
    return getCart().reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
}
