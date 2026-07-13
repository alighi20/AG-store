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
  cheapProducts: "cheap_products"
};

let token = localStorage.getItem(STORAGE_KEYS.token) || null;
let refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken) || null;

const AUTH_CREDENTIALS = {
  userName: "aligh20",
  password: "ali1383",
};



async function authenticate() {
  try {
    const response = await fetch(`${API_BASE_URL}/Authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json-patch+json",
      },
      body: JSON.stringify(AUTH_CREDENTIALS),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const result = await response.json();
    const data = result?.data || result;

    if (!data?.token || !data?.refreshToken) {
      throw new Error("Invalid authentication response: token or refreshToken missing");
    }

    token = `Bearer ${data.token}`;
    refreshToken = data.refreshToken;

    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

    console.log("[AUTH] Authentication successful.");
    return token;
  } catch (error) {
    console.error("[AUTH] authenticate() failed:", error);
    throw error;
  }
}



async function refreshAccessToken() {
  try {
    const currentRefreshToken =
      refreshToken || localStorage.getItem(STORAGE_KEYS.refreshToken);

    if (!currentRefreshToken) {
      console.warn("[AUTH] No refresh token found. Re-authenticating...");
      return await authenticate();
    }

    const response = await fetch(
      `${API_BASE_URL}/Authenticate/NewToken/${currentRefreshToken}`,
      {
        method: "POST",
      headers: {
  "Content-Type": "application/json",
  Authorization: token || localStorage.getItem(STORAGE_KEYS.token) || "",
},


      }
    );

    if (!response.ok) {
      console.warn(`[AUTH] Refresh failed with status ${response.status}. Re-authenticating...`);
      clearAuthState();
      return await authenticate();
    }

    const result = await response.json();
    const data = result?.data || result;

    if (!data?.token || !data?.refreshToken) {
      console.warn("[AUTH] Invalid refresh response. Re-authenticating...");
      clearAuthState();
      return await authenticate();
    }

    token = `Bearer ${data.token}`;
    refreshToken = data.refreshToken;

    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

    console.log("[AUTH] Token refreshed successfully.");
    return token;
  } catch (error) {
    console.error("[AUTH] refreshAccessToken() failed:", error);
    clearAuthState();
    return await authenticate();
  }
}
function clearAuthState() {
  token = null;
  refreshToken = null;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
}





const state = {
  products: [],
  categories: [],
  slides: [],
  selectedCategoryId: null,
  searchTerm: "",
  currentPage: 1,
  pageSize: 10,
  totalPages: 1
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    console.log("App initialized");

    bindEvents();

    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

    // 🔥 اینا رو اضافه کن
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
}

  if (!token) {
    try {
      await authenticate(); // لاگین خودکار با یوزر و پس هاردکد شده
    } catch (error) {
      console.error("[AUTH] Initial authentication failed:", error);
    }
  }

  // ۲. بارگذاری داده‌ها (که خودشان اول کش را چک می‌کنند)
  await Promise.allSettled([loadCategories(), loadProducts(),loadCheapProducts(),loadExpensiveProducts()]);




function getAuthHeaders(contentType = "application/json") {
  return {
    "Content-Type": contentType,
    Authorization: token || localStorage.getItem(STORAGE_KEYS.token) || "",
  };
}



async function request(url, options = {}, retry = true) {
  try {
    if (!token) {
      token = localStorage.getItem(STORAGE_KEYS.token);
    }

    if (!token) {
      await authenticate();
    }

    const requestHeaders = {
      ...getAuthHeaders(options.headers?.["Content-Type"] || "application/json"),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers: requestHeaders,
    });

    if (response.status === 401 && retry) {
      console.warn("[AUTH] 401 received. Attempting token refresh...");
      await refreshAccessToken();
      return request(url, options, false);
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("[REQUEST] Failed:", error);
    throw error;
  }
}


function getApiData(result) {
  if (!result) return [];

  if (Array.isArray(result)) return result;

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (result.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result?.data?.products)) {
    return result.data.products;
  }

  if (Array.isArray(result?.data?.items)) {
    return result.data.items;
  }

  if (Array.isArray(result?.data?.result)) {
    return result.data.result;
  }

  if (Array.isArray(result?.result?.data)) {
    return result.result.data;
  }

  if (Array.isArray(result?.result?.products)) {
    return result.result.products;
  }

  if (Array.isArray(result?.products)) {
    return result.products;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
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
async function loadProducts(page = 1) {
  state.currentPage = page;

  const cacheKey = `${STORAGE_KEYS.products}_cat_${state.selectedCategoryId}_page_${page}`;

  const cachedProducts = readStorage(cacheKey);
  const cachedProductList = Array.isArray(cachedProducts)
    ? cachedProducts
    : cachedProducts?.products;

  if (Array.isArray(cachedProductList) && cachedProductList.length > 0) {
    console.log(`[PRODUCTS] Page ${page} (Cat: ${state.selectedCategoryId}) Loaded from Cache`);

    state.products = cachedProductList;

    const cachedTotal = Array.isArray(cachedProducts)
      ? cachedProductList.length
      : Number(cachedProducts?.total || cachedProductList.length || 0);

    state.totalPages = Math.max(1, Math.ceil(cachedTotal / state.pageSize));

    renderFilteredProducts();
    renderPagination();
    return;
  }

  setProductsLoading();
  console.log(`[PRODUCTS] Fetching Page ${page} (Cat: ${state.selectedCategoryId}) from API...`);

  try {
    const requestBody = {
      size: state.pageSize,
      page: state.currentPage,
      shopCode: SHOP_CODE,
    };

    if (state.selectedCategoryId !== "all" && state.selectedCategoryId !== null && state.selectedCategoryId !== undefined) {
      requestBody.categoryId = Number(state.selectedCategoryId);
    }

    // فرستادن درخواست به API
    let rawResult = await request(
      `${API_BASE_URL}/Product/GetProductWithPagination`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    console.log("[PRODUCTS API] requestBody:", requestBody);
    console.log("[PRODUCTS API] rawResult received:", rawResult);

    // بخش حیاتی: اگر خروجی یک شیء Response خام بود، آن را به JSON تبدیل کن
    let result = rawResult;
    if (rawResult && typeof rawResult.json === 'function') {
      console.log("[PRODUCTS API] Raw Response object detected, parsing to JSON...");
      result = await rawResult.json();
      console.log("[PRODUCTS API] Parsed JSON result:", result);
    }

    const products = getApiData(result);

    const totalItems = Number(
      result?.total ??
      result?.data?.total ??
      result?.data?.count ??
      result?.data?.totalCount ??
      result?.result?.total ??
      result?.result?.count ??
      result?.products?.length ??
      result?.data?.products?.length ??
      products.length ??
      0
    );

    state.totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));

    if (state.currentPage > state.totalPages) {
      state.currentPage = state.totalPages;
    }

    state.products = Array.isArray(products) ? products : [];

    writeStorage(cacheKey, {
      products: state.products,
      total: totalItems,
    });

    renderFilteredProducts();
    renderPagination();

    if (state.products.length === 0) {
      console.warn("[PRODUCTS] API returned empty product list.", result);
      setProductsError("محصولی در این دسته یافت نشد");
    }
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

  // فیلتر جستجو (در صورتی که سرچ سمت کاربر باشد)
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


function renderPagination() {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  let html = `<nav aria-label="Product Pagination"><ul class="pagination justify-content-center" style="direction: rtl;">`;

  // دکمه قبلی
  html += `
    <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${state.currentPage - 1}">قبلی</a>
    </li>
  `;

  // تولید شماره صفحات با حلقه for
  for (let i = 1; i <= state.totalPages; i++) {
    html += `
      <li class="page-item ${i === state.currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }

  // دکمه بعدی
  html += `
    <li class="page-item ${state.currentPage >= state.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${state.currentPage + 1}">بعدی</a>
    </li>
  `;

  html += `</ul></nav>`;
  paginationContainer.innerHTML = html;

  // فعال‌سازی رویدادها
  bindPaginationEvent();
}


function bindPaginationEvent() {
  document.addEventListener("click", (event) => {
    // پیدا کردن دکمه صفحه‌بندی کلیک شده
    const pageLink = event.target.closest(".page-link[data-page]");
    if (!pageLink) return;

    event.preventDefault();

    const newPage = parseInt(pageLink.getAttribute("data-page"));
    
    // جلوگیری از کلیک روی صفحات نامعتبر
    if (newPage > 0 && !event.target.parentElement.classList.contains("disabled")) {
      loadProducts(newPage);
      
      // اسکرول نرم به بالای لیست محصولات
      document.getElementById("app")?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// این خط را داخل تابع bindEvents() موجود اضافه کنید:
// bindPaginationEvent();


async function loadCheapProducts() {
  // ۱. چک کردن کش
  const cachedCheap = readStorage(STORAGE_KEYS.cheapProducts);

  if (cachedCheap && cachedCheap.length > 0) {
    console.log("[CHEAP] Loaded from Cache");
    renderCheapProductsSlider(cachedCheap);
    return;
  }

  // ۲. دریافت از API جدید
  console.log("[CHEAP] Fetching from API...");
  try {
    const result = await request(
      `${API_BASE_URL}/Product/GetTheFreeProducts/5/${SHOP_CODE}`,
      { method: "GET" }
    );

    const products = getApiData(result);

    // ذخیره در کش
    writeStorage(STORAGE_KEYS.cheapProducts, products);
    
    // رندر اسلایدر
    renderCheapProductsSlider(products);
  } catch (error) {
    console.error("خطا در بارگذاری ارزان‌ترین‌ها:", error);
  }
}


async function loadExpensiveProducts() {
  // ۱. چک کردن کش
  const cachedExpensive = readStorage(STORAGE_KEYS.expensiveProducts);

  if (cachedExpensive && cachedExpensive.length > 0) {
    console.log("[EXPENSIVE] Loaded from Cache");
    renderExpensiveProductsSlider(cachedExpensive);
    return;
  }

  // ۲. دریافت از API جدید
  console.log("[Expensive] Fetching from API...");
  try {
    const result = await request(
      `${API_BASE_URL}/Product/GetTheExpensiveProducts/5/${SHOP_CODE}`,
      { method: "GET" }
    );

    const products = getApiData(result);

    // ذخیره در کش
    writeStorage(STORAGE_KEYS.expensiveProducts, products);
    
    // رندر اسلایدر
    renderExpensiveProductsSlider(products);
  } catch (error) {
    console.error("خطا در بارگذاری گران ترین ها:", error);
  }
}


function renderCheapProductsSlider(products) {
    const wrapper = document.getElementById('cheap-products-wrapper');
    if (!wrapper) return;

    const sortedProducts = [...products].sort((a, b) => a.price - b.price);

wrapper.innerHTML = sortedProducts.map(product => `
    <div class="swiper-slide">
        <div class="product-card-mini"
            style="cursor: pointer;"
            onclick="window.dispatchEvent(new CustomEvent('showProductDetails', { detail: { id: ${product.id} } }))">

            <img src="${product.thumbnail}" alt="${product.title}">
            <div class="product-name">${product.title}</div>
            <div class="product-price">${product.price.toLocaleString()} تومان</div>

            <!-- 👇 اینجا اضافه کن -->
            <button 
                onclick='event.stopPropagation(); addToCart({
                    id: ${product.id},
                    name: "${product.title}",
                    price: ${product.price}
                })'>
                🛒 افزودن به سبد
            </button>

        </div>
    </div>
`).join('');

    setTimeout(() => {
        if (window.cheapSliderInstance) {
            window.cheapSliderInstance.destroy(true, true);
        }

        window.cheapSliderInstance = new Swiper('.cheap-products-slider', {
            slidesPerView: 1,
            spaceBetween: 15,
            loop: sortedProducts.length > 4,
            navigation: {
                nextEl: '.cheap-slider-next',
                prevEl: '.cheap-slider-prev',
            },
            observer: true,
            observeParents: true,
            breakpoints: {
                480: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
            },
            rtl: true
        });
    }, 50);
}


function renderExpensiveProductsSlider(products) {
    const wrapper = document.getElementById('expensive-products-wrapper');
    if (!wrapper) return;

    const sortedProducts = [...products].sort((a, b) => b.price - a.price);

    wrapper.innerHTML = sortedProducts.map(product => `
        <div class="swiper-slide">
            <div class="product-card-mini"
                 style="cursor:pointer"
                 onclick="window.dispatchEvent(new CustomEvent('showProductDetails',{detail:{id:${product.id}}}))">
                 
                <img src="${product.thumbnail}" alt="${product.title}">
                
                <div class="product-name">
                    ${product.title}
                </div>

                <div class="product-price">
                    ${Number(product.price).toLocaleString()} تومان
                </div>

            </div>
        </div>
    `).join('');

    if (window.expensiveSliderInstance) {
        window.expensiveSliderInstance.destroy(true, true);
    }

    window.expensiveSliderInstance = new Swiper('.expensive-products-slider', {
        slidesPerView: 1,
        spaceBetween: 15,
        navigation: {
            nextEl: '.expensive-slider-next',
            prevEl: '.expensive-slider-prev',
        },
        breakpoints: {
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
        },
        rtl: true
    });
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

function bindAllProductsLink() {
  const allProductsLink = document.getElementById('allProductsLink');
  if (allProductsLink) {
    allProductsLink.addEventListener('click', (e) => {
      e.preventDefault();
      state.selectedCategoryId = "all";
      state.currentPage = 1;
      loadProducts(1);
    });
  }
}

function bindSliderCategoryEvent() {
  window.addEventListener('categorySelected', (event) => {
    const { categoryId } = event.detail;
    state.selectedCategoryId = categoryId;
    state.currentPage = 1;
    state.searchTerm = "";
    
    loadProducts(1);
    
    // اسکرول به بخش محصولات
    setTimeout(() => {
      document.getElementById("app")?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  });
}

function bindEvents() {
  bindProductDetailsEvent();
  bindBackToProductsEvent();
  bindCategoryEvent();
  bindSearchEvent();
  bindPaginationEvent();
  bindAllProductsLink();
  bindSliderCategoryEvent();
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
    
    // تغییر مهم: ریست کردن صفحه به 1 و فراخوانی محصولات از سرور
    state.currentPage = 1;
    loadProducts(1);
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
function handleRoute() {
    const hash = location.hash;

    console.log("Route:", hash);

    if (hash === "#/cart") {
        renderCartPage();
        return;
    }

    renderProducts();
}