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
  cheapProducts: "cheap_products",
  expensiveProducts: "expensive_products"
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
  currentPage: 1,
  pageSize: 12,
  totalPages: 1
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
  state.selectedCategoryId = "all";
  // ۲. بارگذاری داده‌ها (که خودشان اول کش را چک می‌کنند)
  await Promise.allSettled([loadCategories(), loadProducts(), loadCheapProducts(), loadExpensiveProducts()]);
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

async function loadProducts(page = 1) {
  state.currentPage = page;

  // ۱. اضافه کردن آیدی دسته‌بندی به کلید کش
  // اگر selectedCategoryId مقدار 'all' بود، کش کلی در نظر گرفته می‌شود
  const cacheKey = `${STORAGE_KEYS.products}_cat_${state.selectedCategoryId}_page_${page}`;

  const cachedProducts = readStorage(cacheKey);

  const hasCachedProducts = Array.isArray(cachedProducts)
    ? cachedProducts.length > 0
    : Array.isArray(cachedProducts?.products) && cachedProducts.products.length > 0;

  if (hasCachedProducts) {
    state.products = cachedProducts.products || cachedProducts;

    if (cachedProducts.total !== undefined) {
      state.totalPages = Math.ceil(cachedProducts.total / state.pageSize) || 1;
    }

    renderFilteredProducts();
    renderPagination();
    return;
  }



  setProductsLoading();
  console.log(`[PRODUCTS] Fetching Page ${page} (Cat: ${state.selectedCategoryId}) from API...`);

  try {
    // آماده‌سازی Body برای ارسال به سرور
    const requestBody = {
      size: state.pageSize,
      page: state.currentPage,
      shopCode: SHOP_CODE,
    };

    // ۲. اگر دسته‌بندی خاصی انتخاب شده (به جز همه)، آن را به سرور می‌فرستیم
    // نکته مهم: حتماً Swagger پروژه را چک کنید تا مطمئن شوید اسم این فیلد categoryId است (شاید groupId یا چیز دیگری باشد)
    if (state.selectedCategoryId !== "all") {
      requestBody.categoryId = Number(state.selectedCategoryId);
    }

    const result = await request(
      `${API_BASE_URL}/Product/GetProductWithPagination`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const products = getApiData(result);

    const totalItems = result.total || 0;
    state.totalPages = Math.ceil(totalItems / state.pageSize) || 1;

    // جلوگیری از رفتن به صفحه‌ای که وجود نداره
    if (state.currentPage > state.totalPages) {
      state.currentPage = state.totalPages;
    }


    state.products = products;
    writeStorage(cacheKey, {
      products: products,
      total: result.total || 0
    });


    renderFilteredProducts();
    renderPagination();
  } catch (error) {
    console.error("خطا در بارگذاری محصولات:", error);
    if (state.products.length === 0) {
      setProductsError("خطا در دریافت محصولات. لطفاً دوباره تلاش کنید.");
    }
  }
}

function resetToDefaultProductsView() {
  state.selectedCategoryId = "all";
  state.searchTerm = "";
  state.currentPage = 1;
  loadProducts(1);
}

document.getElementById("productsBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  resetToDefaultProductsView();
});



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

  // ۱. مرتب‌سازی از ارزان‌ترین به گران‌ترین
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  // ۲. تولید HTML اسلایدها (اضافه شدن رویداد کلیک و استایل نشانگر موس)
  wrapper.innerHTML = sortedProducts.map(product => `
        <div class="swiper-slide">
            <div class="product-card-mini" 
                 style="cursor: pointer;" 
                 onclick="window.dispatchEvent(new CustomEvent('showProductDetails', { detail: { id: ${product.id} } }))">
                <img src="${product.thumbnail}" alt="${product.title}">
                <div class="product-name">${product.title}</div>
                <div class="product-price">${product.price.toLocaleString()} تومان</div>
            </div>
        </div>
    `).join('');

  // ۳. راه‌اندازی Swiper با تاخیر کوچک جهت اطمینان از رندر کامل DOM
  setTimeout(() => {
    if (window.cheapSliderInstance) {
      window.cheapSliderInstance.destroy(true, true);
    }

    window.cheapSliderInstance = new Swiper('.cheap-products-slider', {
      slidesPerView: 1,
      spaceBetween: 15,
      loop: sortedProducts.length > 4, // فعال‌سازی لوپ فقط در صورت کافی بودن تعداد محصولات
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

function bindEvents() {
  bindProductDetailsEvent();
  bindBackToProductsEvent();
  bindCategoryEvent();
  bindSearchEvent();
  bindPaginationEvent();
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
    state.searchTerm = "";
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
