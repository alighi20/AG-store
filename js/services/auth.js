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

export function logout() {
    localStorage.removeItem("token");
    setState({ token: null, products: [], filteredProducts: [] });
    renderAuthState();
    showToast("خروج انجام شد", "info");
    location.hash = "/";
}
