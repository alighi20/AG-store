const API_BASE = "https://api.apitester.ir/api";

async function handleResponse(res) {
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "خطا در ارتباط با سرور");
    }

    return data;
}

export async function apiLogin(username, password) {
    const res = await fetch(`${API_BASE}/Authenticate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userName: username,
            password: password
        })
    });

    return handleResponse(res);
}

export async function apiGetProducts(token) {
    const res = await fetch(`${API_BASE}/Product`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    return handleResponse(res);
}
