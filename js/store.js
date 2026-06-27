export const state = {
    token: localStorage.getItem("token") || null,
    products: [],
    filteredProducts: [],
    cart: JSON.parse(localStorage.getItem("cart") || "[]"),
    currentPage: 1,
    perPage: 6,
    loading: false,
    search: "",
    filters: {
        minPrice: "",
        maxPrice: "",
        sort: "default",
        category: "all"
    }
};

const listeners = [];

export function getState() {
    return state;
}

export function setState(partial) {
    Object.assign(state, partial);
    listeners.forEach(listener => listener(state));
}

export function subscribe(listener) {
    listeners.push(listener);
}
