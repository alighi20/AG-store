import { renderHomePage, renderCartPage, renderProductDetailsPage } from "./ui.js";

export function initRouter() {
    function resolveRoute() {
        const hash = location.hash || "#/";
        const app = document.getElementById("app");

        if (hash === "#/" || hash === "") {
            renderHomePage();
            return;
        }

        if (hash === "#/cart") {
            renderCartPage();
            return;
        }

        if (hash.startsWith("#/product/")) {
            const id = hash.split("/")[2];
            renderProductDetailsPage(id);
            return;
        }

        app.innerHTML = `<div class="empty-state">صفحه پیدا نشد</div>`;
    }

    window.addEventListener("hashchange", resolveRoute);
    resolveRoute();
}
