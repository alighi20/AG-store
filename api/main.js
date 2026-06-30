import {
  renderCategories,
  renderProducts,
  renderProductDetail,
  renderSlider,
} from "../js/ui.js";

const API_BASE_URL = "https://api.apitester.ir/api";

const SHOP_CODE = "1a881749-a3b6-4dad-3f26-08decb8b3712";




const STORAGE_KEYS = {
  slides: "app_slides",
  products: "app_products",
  categories: "app_categories",
  token: "auth_token",
  refreshToken: "refresh_token",
};

let token = localStorage.getItem(STORAGE_KEYS.token) || null;
let refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken) || null;

const AUTH_CREDENTIALS = {
  userName: "aligh20",
  password: "ali1383",
};

async function authenticate() {
  console.log("[AUTH] Calling /Authenticate ...");

  const response = await fetch(`${API_BASE_URL}/Authenticate`, {
    method: "POST",
    headers: {
      "accept": "*/*",
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(AUTH_CREDENTIALS),
  });

  if (!response.ok) {
    throw new Error(`Authenticate failed: ${response.status}`);
  }

  const result = await response.json();

  // ساختار خروجی دقیقا مثل اسکرین شات:
  // { data: { token: "...", refreshToken: "...", ... }, isSuccess: true, ... }
  const data = result?.data;

  if (!data || !data.token || !data.refreshToken) {
    throw new Error("Invalid auth response");
  }

  token = `Bearer ${data.token}`;
  refreshToken = data.refreshToken;

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

  console.log("[AUTH] Login success, token & refreshToken stored.");
  return token;
}

async function refreshAccessToken() {
  const currentRefreshToken =
    refreshToken || localStorage.getItem(STORAGE_KEYS.refreshToken);

  if (!currentRefreshToken) {
    console.warn("[AUTH] No refresh token, falling back to authenticate()");
    return authenticate();
  }

  console.log("[AUTH] Refreshing token ...");

  const response = await fetch(
    `${API_BASE_URL}/Authenticate/NewToken/${currentRefreshToken}`,
    {
      method: "POST",
      headers: {
        accept: "*/*",
        Authorization: token || localStorage.getItem(STORAGE_KEYS.token) || "",
      },
    }
  );

  if (!response.ok) {
    console.warn(
      `[AUTH] Refresh failed with status ${response.status}, falling back to authenticate().`
    );
    return authenticate();
  }

  const result = await response.json();
  const data = result?.data;

  if (!data || !data.token || !data.refreshToken) {
    console.warn("[AUTH] Refresh response invalid, falling back to authenticate().");
    return authenticate();
  }

  token = `Bearer ${data.token}`;
  refreshToken = data.refreshToken;

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

  console.log("[AUTH] Token refreshed.");
  return token;
}



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

  // ۱. مطمئن شدن از وجود توکن معتبر
  if (!token) {
    token = localStorage.getItem(STORAGE_KEYS.token);
  }
  if (!token) {
    try {
      await authenticate(); // لاگین خودکار با یوزر و پس هاردکد شده
    } catch (error) {
      console.error("[AUTH] Initial authentication failed:", error);
    }
  }

  // ۲. بارگذاری داده‌ها (که خودشان اول کش را چک می‌کنند)
  await Promise.allSettled([loadCategories(), loadProducts()]);
}



function getAuthHeaders(contentType = "application/json") {
  return {
    "Content-Type": contentType,
    Authorization: token,
  };
}

async function request(url, options = {}, retry = true) {
  // اگر هنوز توکن نداریم (بار اول)، login کن
  if (!token) {
    token = localStorage.getItem(STORAGE_KEYS.token);
  }
  if (!token) {
    await authenticate();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(options.headers?.["Content-Type"] || "application/json"),
      ...(options.headers || {}),
    },
  });

  // اگر توکن منقضی شده بود
  if (response.status === 401 && retry) {
    console.warn("[AUTH] 401 received, trying refreshAccessToken...");

    await refreshAccessToken();

    // بعد از رفرش، دوباره همون request را با retry=false بفرست
    return request(url, options, false);
  }

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
  // ۱. بررسی وجود دسته‌بندی‌ها در کش localStorage
  const cachedCategories = readStorage(STORAGE_KEYS.categories);

  if (cachedCategories && cachedCategories.length > 0) {
    console.log("[CATEGORIES] Loaded from Cache (Local Storage)");
    state.categories = cachedCategories;
    renderCategories(cachedCategories);
    renderSlider(cachedCategories); 
    return; // خروج از تابع؛ نیازی به درخواست API نیست
  }

  // ۲. اگر کش خالی بود، درخواست به سرور ارسال می‌شود
  console.log("[CATEGORIES] Cache empty. Fetching from API...");
  try {
    const result = await request(
      `${API_BASE_URL}/Category/GetCategory/${SHOP_CODE}`,
      {
        method: "GET",
      },
    );

    const categories = getApiData(result);

    state.categories = categories;
    writeStorage(STORAGE_KEYS.categories, categories); // ذخیره در کش برای دفعات بعدی
    
    renderCategories(categories);
    renderSlider(categories); // رندر اسلایدر در اولین دریافت از API
  } catch (error) {
    console.error("خطا در بارگذاری دسته‌بندی‌ها:", error);
  }
}

async function loadProducts() {
  // ۱. بررسی وجود محصولات در کش localStorage
  const cachedProducts = readStorage(STORAGE_KEYS.products);

  if (cachedProducts && cachedProducts.length > 0) {
    console.log("[PRODUCTS] Loaded from Cache (Local Storage)");
    state.products = cachedProducts;
    renderFilteredProducts(); // رندر محصولات بر اساس فیلتر/جستجو
    return; // خروج از تابع؛ نیازی به درخواست API نیست
  }

  // ۲. اگر کش خالی بود، لودینگ نشان داده و درخواست به سرور ارسال می‌شود
  setProductsLoading();
  console.log("[PRODUCTS] Cache empty. Fetching from API...");

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
    writeStorage(STORAGE_KEYS.products, products); // ذخیره در کش برای دفعات بعدی
    
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
