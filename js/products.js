import { apiGetProducts } from "./api.js";
import { getToken } from "./auth.js";
import { getState, setState } from "./store.js";
import { showToast, renderProducts, setStatus } from "./ui.js";

export async function loadProducts() {
    const token = getToken();

    if (!token) {
        setState({ products: [], filteredProducts: [] });
        renderProducts([]);
        setStatus("برای مشاهده محصولات وارد شوید");
        return;
    }

    try {
        setState({ loading: true });
        setStatus("در حال دریافت محصولات...");

        const data = await apiGetProducts(token);

        setState({
            products: Array.isArray(data) ? data : [],
            loading: false,
            currentPage: 1
        });

        applyFilters();
        setStatus("محصولات بارگذاری شد");
    } catch (error) {
        setState({ loading: false });
        showToast(error.message || "خطا در دریافت محصولات", "error");
        setStatus("خطا در بارگذاری");
    }
}

export function applyFilters() {
    const { products, search, filters } = getState();

    let result = [...products];

    if (search.trim()) {
        result = result.filter(p =>
            (p.title || "").toLowerCase().includes(search.toLowerCase())
        );
    }

    if (filters.minPrice !== "") {
        result = result.filter(p => Number(p.price) >= Number(filters.minPrice));
    }

    if (filters.maxPrice !== "") {
        result = result.filter(p => Number(p.price) <= Number(filters.maxPrice));
    }

    if (filters.sort === "price-asc") {
        result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (filters.sort === "price-desc") {
        result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (filters.sort === "title") {
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    setState({
        filteredProducts: result,
        currentPage: 1
    });

    renderProducts(result);
}

export function getProductById(id) {
    return getState().products.find(p => Number(p.id) === Number(id));
}
