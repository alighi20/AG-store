import { renderCategories, renderProducts , renderProductDetail } from "./ui.js";



// مقداردهی اولیه اسلایدر Swiper
function initHeroSlider() {
    new Swiper('.hero-slider', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // برای بهبود حرکت در زبان‌های راست‌به‌چپ (RTL)
        rtl: true 
    });
}

// این تابع را درون تابع اصلی DOMContentLoaded خود صدا بزنید:
document.addEventListener("DOMContentLoaded", () => {
    initHeroSlider();
    // مابقی کدهای init شما...
});

// مدیریت پویا و ذخیره‌سازی توکن
let token = localStorage.getItem("auth_token") || "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyR3VpZCI6IjY5MTE1YWRiLTk0M2MtNDZlZS05OWE1LWQ4ZGIzMmQyNDNiNyIsInNob3BDb2RlIjoiMWE4ODE3NDktYTNiNi00ZGFkLTNmMjYtMDhkZWNiOGIzNzEyIiwiVGltZU91dC1NaW51dGUiOiI2MCIsIm5iZiI6MTc4MjcxOTc3OSwiZXhwIjoxNzgyNzIzMzc5LCJpYXQiOjE3ODI3MTk3Nzl9.9UdQZJpDILdUmLRPFDe1lAYg21KQ566u3ClrdG1thB8";
const shopCode = "1a881749-a3b6-4dad-3f26-08decb8b3712";

document.addEventListener("DOMContentLoaded", init);

async function init() {
    bindEvents();
    await loadCategories();
    await loadProducts();
}

// ۱. دریافت لیست دسته‌بندی‌ها
async function loadCategories() {
    try {
        const response = await fetch(
            `https://api.apitester.ir/api/Category/GetCategory/${shopCode}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
            }
        );

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const result = await response.json();
        const categories = result.isSuccess ? result.data : [];
        renderCategories(categories);
    } catch (error) {
        console.error("خطا در بارگذاری دسته‌بندی‌ها:", error);
    }
}

// ۲. دریافت لیست محصولات (صفحه‌بندی شده)
async function loadProducts() {
    try {
        const response = await fetch(
            "https://api.apitester.ir/api/Product/GetProductWithPagination",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    size: 12, // عدد ۱۲ بخش‌پذیر بر ۶ (هر ردیف) است و گرید را کامل پر می‌کند
                    page: 1,
                    shopCode: shopCode
                })
            }
        );

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const result = await response.json();
        renderProducts(result.data);
    } catch (error) {
        console.error("خطا در بارگذاری محصولات:", error);
    }
}

// ۳. سرویس دریافت تک محصول بر اساس ID
async function getProductById(id) {
    const response = await fetch(
        `https://api.apitester.ir/api/Product/GetProductById`, // دقت کنید: بدون پارامتر در URL
        {
            method: "POST", // متد حتماً POST باشد
            headers: {
                "Content-Type": "application/json-patch+json", // از هدر دقیق Swagger استفاده کردیم
                "Authorization": token
            },
            body: JSON.stringify({
                shopCode: "1a881749-a3b6-4dad-3f26-08decb8b3712",
                id: Number(id) // آیدی را به عدد تبدیل می‌کنیم
            })
        }
    );

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const result = await response.json();
    return result.isSuccess ? result.data : null;
}




// ۵. مدیریت رویدادها و کلیک‌ها
function bindEvents() {
    // شنیدن رویداد کلیک کارت از ui.js
    window.addEventListener('showProductDetails', async (e) => {
        const productId = e.detail.id;
        const app = document.getElementById("app");
        
        // نمایش لودینگ شیک قبل از بارگذاری اطلاعات
        app.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 text-muted">در حال دریافت اطلاعات محصول...</p>
            </div>
        `;
        
            const product = await getProductById(productId);
            if (product) {
                renderProductDetail(product);
            } else {
                app.innerHTML = `<div class="alert alert-warning">محصول یافت نشد.</div>`;
            }
      
    });

    // کدهای فیلتر و جستجوی شما
    document.addEventListener("click", async (e) => {
        const link = e.target.closest("[data-category-id]");
        if (!link) return;

        e.preventDefault();
        await loadProducts();
    });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        let timer;
        searchInput.addEventListener("input", () => {
            clearTimeout(timer);
        });
    }
}
