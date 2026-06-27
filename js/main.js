import { initRouter } from "./router.js";
import { bindGlobalEvents, renderAuthState, renderCartDrawer, updateCartCount } from "./ui.js";
import { loadProducts } from "./products.js";
import { getState } from "./store.js";

document.addEventListener("DOMContentLoaded", async () => {
    bindGlobalEvents();
    renderAuthState();
    updateCartCount();
    renderCartDrawer();
    initRouter();

    if (getState().token) {
        await loadProducts();
    }
});
