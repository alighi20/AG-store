import { apiLogin } from "./api.js";
import { setState, getState } from "./store.js";
import { showToast, renderAuthState } from "./ui.js";

export function getToken() {
    return getState().token;
}

export async function login(username, password) {
    if (!username || !password) {
        showToast("نام کاربری و رمز عبور الزامی است", "error");
        return;
    }

    try {
        const result = await apiLogin(username, password);

        if (result.token) {
            localStorage.setItem("token", result.token);
            setState({ token: result.token });
            renderAuthState();
            showToast("ورود موفق", "success");
        } else {
            showToast("توکن دریافت نشد", "error");
        }
    } catch (error) {
        showToast(error.message || "خطا در ورود", "error");
    }
}

function logout() {

    localStorage.removeItem("token");
    setState({ token: null, products: [], filteredProducts: [] });
    renderAuthState();
    showToast("خروج انجام شد", "info");
    location.hash = "/";
}
document.addEventListener('DOMContentLoaded', () => {
    const openLoginBtn = document.getElementById('openLoginBtn');
    const openRegisterBtn = document.getElementById('openRegisterBtn');

    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', () => {
            window.location.href = "login.html";
        });
    }

    if (openRegisterBtn) {
        openRegisterBtn.addEventListener('click', () => {
            window.location.href = "register.html";
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // جلوگیری از رفرش شدن صفحه

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // فراخوانی متد لاگین از فایل api.js که قبلا با هم ساختیم
                const response = await login({
                    userName: username,
                    password: password
                });

                if (response && response.token) {
                    // ذخیره توکن در لوکال استورج برای استفاده در APIهای بعدی
                    localStorage.setItem('userToken', response.token);
                    
                    alert('خوش آمدید!');
                    window.location.href = 'index.html'; // هدایت به صفحه اصلی
                } else {
                    alert('نام کاربری یا رمز عبور اشتباه است');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('خطا در برقراری ارتباط با سرور');
            }
        });
    }
});
