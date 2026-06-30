import {
  renderCategories,
  renderProducts,
  renderProductDetail,
  renderSlider,
} from "../js/ui.js";

const API_BASE_URL = "https://api.apitester.ir/api";

const SHOP_CODE = "1a881749-a3b6-4dad-3f26-08decb8b3712";

const DEFAULT_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyR3VpZCI6IjY5MTE1YWRiLTk0M2MtNDZlZS05OWE1LWQ4ZGIzMmQyNDNiNyIsInNob3BDb2RlIjoiMWE4ODE3NDktYTNiNi00ZGFkLTNmMjYtMDhkZWNiOGIzNzEyIiwiVGltZU91dC1NaW51dGUiOiI2MCIsIm5iZiI6MTc4MjgwMzI0MiwiZXhwIjoxNzgyODA2ODQyLCJpYXQiOjE3ODI4MDMyNDJ9.STO0Zm2yPE2-Iw6Owly1YXTYZZAnH7S1kZXP3eauWcw";

const token = localStorage.getItem("auth_token") || DEFAULT_TOKEN;

const STORAGE_KEYS = {
  slides: "app_slides",
  products: "app_products",
  categories: "app_categories",
   token: "auth_token",         // اضافه شد
  refreshToken: "refresh_token" // اضافه شد
};

const state = {
  products: [],
  categories: [],
  slides: [],
  selectedCategoryId: null,
  searchTerm: "",
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  console.log("App initialized");

  bindEvents();
  renderCachedData();

  await Promise.allSettled([loadCategories(), loadProducts()]);
}

function getAuthHeaders(contentType = "application/json") {
  return {
    "Content-Type": contentType,
    Authorization: token,
  };
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

function getApiData(result) {
  if (!result) return [];

  if (Array.isArray(result)) return result;

  if (result.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

function renderCachedData() {
  const cachedSlides = readStorage(STORAGE_KEYS.slides);
  const cachedProducts = readStorage(STORAGE_KEYS.products);
  const cachedCategories = readStorage(STORAGE_KEYS.categories);

  if (cachedCategories.length > 0) {
    state.categories = cachedCategories;
    renderCategories(cachedCategories);
    renderSlider(cachedCategories);
  }

  if (cachedProducts.length > 0) {
    state.products = cachedProducts;
    renderProducts(cachedProducts);
  }
}

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.warn(`خطا در خواندن کش ${key}:`, error);
    localStorage.removeItem(key);
    return [];
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`خطا در ذخیره کش ${key}:`, error);
  }
}

async function loadCategories() {
  try {
    const result = await request(
      `${API_BASE_URL}/Category/GetCategory/${SHOP_CODE}`,
      {
        method: "GET",
      },
    );

    const categories = getApiData(result);

    state.categories = categories;
    writeStorage(STORAGE_KEYS.categories, categories);
    renderCategories(categories);
  } catch (error) {
    console.error("خطا در بارگذاری دسته‌بندی‌ها:", error);
  }
}

async function loadProducts() {
  setProductsLoading();

  try {
    const result = await request(
      `${API_BASE_URL}/Product/GetProductWithPagination`,
      {
        method: "POST",
        body: JSON.stringify({
          size: 10,
          page: 1,
          shopCode: SHOP_CODE,
        }),
      },
    );

    const products = getApiData(result);

    state.products = products;
    writeStorage(STORAGE_KEYS.products, products);
    renderFilteredProducts();
  } catch (error) {
    console.error("خطا در بارگذاری محصولات:", error);

    if (state.products.length === 0) {
      setProductsError("خطا در دریافت محصولات. لطفاً دوباره تلاش کنید.");
    }
  }
}

async function getProductById(id) {
  const result = await request(`${API_BASE_URL}/Product/GetProductById`, {
    method: "POST",
    headers: getAuthHeaders("application/json-patch+json"),
    body: JSON.stringify({
      shopCode: SHOP_CODE,
      id: Number(id),
    }),
  });

  return result && result.isSuccess ? result.data : null;
}

function renderFilteredProducts() {
  let filteredProducts = [...state.products];

  if (state.selectedCategoryId) {
    filteredProducts = filteredProducts.filter((product) => {
      return (
        String(
          product.categoryId || product.categoryID || product.category?.id,
        ) === String(state.selectedCategoryId)
      );
    });
  }

  if (state.searchTerm) {
    const term = state.searchTerm.trim().toLowerCase();

    filteredProducts = filteredProducts.filter((product) => {
      const title = String(product.title || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();

      return title.includes(term) || description.includes(term);
    });
  }

  renderProducts(filteredProducts);
}

function setProductsLoading() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">در حال دریافت محصولات...</p>
        </div>
    `;
}

function setProductsError(message) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger text-center">
                ${message}
            </div>
        </div>
    `;
}

function setProductDetailLoading() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">در حال دریافت اطلاعات محصول...</p>
        </div>
    `;
}

function bindEvents() {
  bindProductDetailsEvent();
  bindBackToProductsEvent();
  bindCategoryEvent();
  bindSearchEvent();
}

function bindProductDetailsEvent() {
  window.addEventListener("showProductDetails", async (event) => {
    const productId = event.detail?.id;

    if (!productId) return;

    setProductDetailLoading();

    try {
      const product = await getProductById(productId);

      if (product) {
        renderProductDetail(product);
      } else {
        setProductsError("محصول یافت نشد.");
      }
    } catch (error) {
      console.error("خطا در دریافت جزئیات محصول:", error);
      setProductsError("خطا در دریافت اطلاعات محصول.");
    }
  });
}

function bindBackToProductsEvent() {
  window.addEventListener("backToProducts", () => {
    renderFilteredProducts();
  });
}

function bindCategoryEvent() {
  document.addEventListener("click", (event) => {
    const categoryLink = event.target.closest("[data-category-id]");

    if (!categoryLink) return;

    event.preventDefault();

    state.selectedCategoryId = categoryLink.dataset.categoryId;
    renderFilteredProducts();
  });
}

function bindSearchEvent() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) return;

  let timer;

  searchInput.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      state.searchTerm = searchInput.value;
      renderFilteredProducts();
    }, 300);
  });
}
