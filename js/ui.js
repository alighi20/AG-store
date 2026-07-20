// ui.js

/**
 * رندر دسته‌بندی‌ها در منو
 */
export function renderCategories(categories) {
    const navContainer = document.getElementById("submenu-category");
    if (!navContainer) return;

    navContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    categories.forEach((item) => {
        const li = document.createElement("li");
        li.className = "p-2 border-bottom-0";
        li.style.listStyle = "none";

        li.innerHTML = `
            <a href="#" class="text-decoration-none text-dark d-block category-link" data-category-id="${item.id}">
                <i class="fa fa-chevron-left small me-2 text-muted"></i>
                <span class="fw-bold">${item.title}</span>
            </a>
        `;

        fragment.appendChild(li);
    });

    navContainer.appendChild(fragment);
}


/**
 * رندر کارت‌های محصولات (۶ در هر ردیف)
 */
export function renderProducts(products) {
    const app = document.getElementById("app");
    if (!app) return;

    if (!products || products.length === 0) {
        app.innerHTML = `
            <div class="col-12 text-center py-5">
                <img src="img/no-product.png" style="width:100px; opacity:0.5" />
                <p class="mt-3 text-muted font-vazir">محصولی در این دسته یافت نشد</p>
            </div>
        `;
        return;
    }

    app.innerHTML = `
        <div class="row g-3 w-100 m-0">
            ${products.map(p => `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="product-card card h-100 border-0 shadow-sm rounded-4 p-2 clickable-product" data-id="${p.id}">
                        
                        <div class="product-card__img text-center p-2">
                            <img 
                                alt="${p.title}" 
                                src="${p.thumbnail}" 
                                class="img-fluid rounded-3"
                                style="height:140px; object-fit:contain;"
                            />
                        </div>

                        <div class="card-body p-2 d-flex flex-column text-center">
                            
                            <h6 class="product-card__title fw-bold text-truncate mb-2" title="${p.title}">
                                ${p.title}
                            </h6>

                            <div class="product-card__price text-danger fw-bold mt-auto small">
                                ${Number(p.price || 0).toLocaleString()} 
                                <small>تومان</small>
                            </div>

                        </div>

                    </div>
                </div>
            `).join("")}
        </div>
    `;

    initProductClicks();
    console.log(products[0]);
}



/**
 * صفحه جزئیات محصول
 */
export function renderProductDetail(product) {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="col-12">

            <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">

                <button id="backToListBtn"
                        class="btn btn-outline-secondary rounded-pill mb-4 btn-sm align-self-start">
                    <i class="fa fa-arrow-right me-2"></i>
                    بازگشت به لیست محصولات
                </button>

                <div class="row g-4 align-items-center">

                    <div class="col-md-5 text-center">
                        <img
                            src="${product.thumbnail}"
                            alt="${product.title}"
                            class="img-fluid rounded-4 shadow-sm"
                            style="max-height:350px; object-fit:contain; width:100%;"
                        >
                    </div>

                    <div class="col-md-7 d-flex flex-column justify-content-between">

                        <div>
                            <h2 class="fw-bold mb-3">${product.title}</h2>

                            <p class="text-muted mb-4">
                                ${product.description || "توضیحاتی برای این محصول ثبت نشده است"}
                            </p>
                        </div>

                        <div class="border-top pt-3 d-flex align-items-center justify-content-between">

                            <div>
                                <span class="text-muted small d-block">
                                    قیمت مصرف‌کننده
                                </span>

                                <span class="text-danger fw-bold h3">
                                    ${Number(product.price).toLocaleString()}
                                </span>

                                <small class="text-danger">تومان</small>
                            </div>

                        <button 
class="btn btn-primary btn-lg rounded-pill px-4"
onclick='addToCart({
    id: ${product.id},
    name: "${product.title}",
    price: ${product.price}
})'>
افزودن به سبد خرید
</button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    `;

    const backBtn = document.getElementById("backToListBtn");

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("backToProducts"));
        });
    }
}



/**
 * مدیریت کلیک روی کارت محصول
 */
function initProductClicks() {

    const productCards = document.querySelectorAll(".clickable-product");

    productCards.forEach(card => {

        card.addEventListener("click", function () {

            const productId = this.getAttribute("data-id");

            window.dispatchEvent(
                new CustomEvent("showProductDetails", {
                    detail: { id: productId }
                })
            );

        });

    });

}



/**
 * رندر اسلایدر
 */

export function renderSlider(slides) {
  console.log("renderSlider called", slides);

  const container = document.querySelector(".testim .cont");
  const dotsContainer = document.querySelector(".testim .dots");

  if (!container) {
    console.error("Slider container not found (.testim .cont)");
    return;
  }

  if (!dotsContainer) {
    console.error("Slider dots not found (.testim .dots)");
    return;
  }

  if (!slides || slides.length === 0) {
    console.warn("No slides received");
    return;
  }

  container.innerHTML = "";
  dotsContainer.innerHTML = "";

  slides.forEach((slide, index) => {
    const image = slide.thumbnail || "";
    const title = slide.title || slide.name || slide.fileUrl || "بدون عنوان";
    const description = slide.description || slide.text || "";
    const link = slide.link || "#";

    const slideDiv = document.createElement("div");

    if (index === 0) {
      slideDiv.classList.add("active");
    }

    // مهم: اتصال اسلاید به فیلتر دسته‌بندی
    if (slide.id != null) {
      slideDiv.dataset.categoryId = String(slide.id);
    }

    slideDiv.innerHTML = `
      <div class="img">
        <img src="${image}" alt="${title}">
      </div>

      <div class="content-wrapper">
        <h4 class="h4 mt-4">${title}</h4>
        <a href="${link}" class="btn-buy">مشاهده و خرید</a>
      </div>
    `;

    container.appendChild(slideDiv);

    const dot = document.createElement("span");
    dot.className = index === 0 ? "dot active" : "dot";
    dotsContainer.appendChild(dot);
  });

  initSliderNavigation();
}


/** اضافه کردن کلیک روی اسلایدرها */
function initSliderCategoryClicks() {
    const buttons = document.querySelectorAll('.slider-category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.categoryId;
            if (categoryId) {
                window.dispatchEvent(new CustomEvent('categorySelected', {
                    detail: { categoryId: categoryId }
                }));
            }
        });
    });
}




/**
 * کنترل حرکت اسلایدر
 */
function initSliderNavigation() {

    const slides = Array.from(
        document.querySelectorAll(".testim .cont > div")
    );

    const dots = Array.from(
        document.querySelectorAll(".testim .dots .dot")
    );

    const arrowLeft = document.querySelector(".testim .arrow.left");
    const arrowRight = document.querySelector(".testim .arrow.right");

    let activeIndex = 0;

    if (slides.length === 0) return;


    function updateSlider(index) {

        slides.forEach(s => s.classList.remove("active"));
        dots.forEach(d => d.classList.remove("active"));

        slides[index].classList.add("active");

        if (dots[index]) {
            dots[index].classList.add("active");
        }

        activeIndex = index;

    }


    dots.forEach((dot, i) => {

        dot.addEventListener("click", () => {
            updateSlider(i);
        });

    });


    if (arrowLeft) {

        arrowLeft.onclick = () => {

            const next =
                activeIndex - 1 < 0
                    ? slides.length - 1
                    : activeIndex - 1;

            updateSlider(next);

        };

    }


    if (arrowRight) {

        arrowRight.onclick = () => {

            const next =
                activeIndex + 1 >= slides.length
                    ? 0
                    : activeIndex + 1;

            updateSlider(next);

        };

    }

}
