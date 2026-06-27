const TOKEN_KEY = 'userToken';

function updateAuthUI() {
  const token = localStorage.getItem(TOKEN_KEY);

  const guestBox = document.getElementById('guestBox');
  const userBox = document.getElementById('userBox');

  if (!guestBox || !userBox) return;

  if (token) {
    guestBox.classList.add('hidden');
    userBox.classList.remove('hidden');
  } else {
    guestBox.classList.remove('hidden');
    userBox.classList.add('hidden');
  }
}

function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  updateAuthUI();
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  const logoutBtn = document.getElementById('logoutBtn');
  const openLoginBtn = document.getElementById('openLoginBtn');
  const openRegisterBtn = document.getElementById('openRegisterBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => {
      window.location.href="login.html"
    });
  }

  if (openRegisterBtn) {
    openRegisterBtn.addEventListener('click', () => {
    window.location.href="register.html"
    });
  }
});
// api.js
const API_BASE_URL = 'https://api.apitester.ir';

function getToken() {
  return localStorage.getItem('userToken');
}

function buildHeaders(isJson = true, extraHeaders = {}) {
  const headers = {
    ...extraHeaders,
  };

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    isJson = true,
  } = options;

  const fetchOptions = {
    method,
    headers: buildHeaders(isJson, headers),
  };

  if (body !== undefined) {
    fetchOptions.body = isJson ? JSON.stringify(body) : body;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data && data.message) ||
      (typeof data === 'string' && data) ||
      `HTTP Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  auth: {
    login(loginViewModel) {
      return request('/api/Authenticate', {
        method: 'POST',
        body: loginViewModel,
      });
    },
    refreshToken(refreshToken) {
      return request(`/api/Authenticate/NewToken/${encodeURIComponent(refreshToken)}`, {
        method: 'POST',
        isJson: false,
      });
    },
  },

  category: {
    getByShopCode(shopcode, title = '') {
      const query = title ? `?title=${encodeURIComponent(title)}` : '';
      return request(`/api/Category/GetCategory/${encodeURIComponent(shopcode)}${query}`);
    },
    getWithPagination(payload) {
      return request('/api/Category/GetCategoryWithPagination', {
        method: 'POST',
        body: payload,
      });
    },
    getById(payload) {
      return request('/api/Category/GetCategoryById', {
        method: 'POST',
        body: payload,
      });
    },
    add(payload) {
      return request('/api/Category/AddCategory', {
        method: 'POST',
        body: payload,
      });
    },
    update(payload) {
      return request('/api/Category/UpdateCategory', {
        method: 'PUT',
        body: payload,
      });
    },
    remove(payload) {
      return request('/api/Category/DeleteCategory', {
        method: 'DELETE',
        body: payload,
      });
    },
  },

  customer: {
    getByShopCode(shopcode, filters = {}) {
      const params = new URLSearchParams();
      if (filters.firstName) params.set('firstName', filters.firstName);
      if (filters.lastName) params.set('lastName', filters.lastName);
      if (filters.shopcode) params.set('shopcode', filters.shopcode);

      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/Customer/GetCustomer/${encodeURIComponent(shopcode)}${query}`);
    },
    getWithPagination(payload) {
      return request('/api/Customer/GetCustomerWithPagination', {
        method: 'POST',
        body: payload,
      });
    },
    getById(payload) {
      return request('/api/Customer/GetCustomerById', {
        method: 'POST',
        body: payload,
      });
    },
    add(payload) {
      return request('/api/Customer/AddCustomer', {
        method: 'POST',
        body: payload,
      });
    },
    update(payload) {
      return request('/api/Customer/UpdateCustomer', {
        method: 'PUT',
        body: payload,
      });
    },
    remove(payload) {
      return request('/api/Customer/DeleteCustomer', {
        method: 'DELETE',
        body: payload,
      });
    },
  },

  order: {
    getByShopCode(shopcode, customerId) {
      const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
      return request(`/api/Order/GetOrder/${encodeURIComponent(shopcode)}${query}`);
    },
    getWithDetail(shopcode, customerId) {
      const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
      return request(`/api/Order/GetOrderWithDetail/${encodeURIComponent(shopcode)}${query}`);
    },
    getWithDetailByPagination(payload) {
      return request('/api/Order/GetOrderWithDetailByPagination', {
        method: 'POST',
        body: payload,
      });
    },
    getWithPagination(payload) {
      return request('/api/Order/GetOrderWithPagination', {
        method: 'POST',
        body: payload,
      });
    },
    getById(payload) {
      return request('/api/Order/GetOrderById', {
        method: 'POST',
        body: payload,
      });
    },
    getDetailByOrderId(orderId, shopcode) {
      return request(`/api/Order/GetOrderDetailByOrderId/${encodeURIComponent(orderId)}/${encodeURIComponent(shopcode)}`);
    },
    add(payload) {
      return request('/api/Order/AddOrder', {
        method: 'POST',
        body: payload,
      });
    },
    update(payload) {
      return request('/api/Order/UpdateOrder', {
        method: 'PUT',
        body: payload,
      });
    },
    remove(payload) {
      return request('/api/Order/DeleteOrder', {
        method: 'DELETE',
        body: payload,
      });
    },
  },

  product: {
    getByShopCode(shopcode, filters = {}) {
      const params = new URLSearchParams();
      if (filters.title) params.set('title', filters.title);
      if (filters.categoryId !== undefined && filters.categoryId !== null) {
        params.set('categoryId', filters.categoryId);
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/Product/GetProduct/${encodeURIComponent(shopcode)}${query}`);
    },
    getFreeProducts(number, shopcode) {
      return request(`/api/Product/GetTheFreeProducts/${encodeURIComponent(number)}/${encodeURIComponent(shopcode)}`);
    },
    getExpensiveProducts(number, shopcode) {
      return request(`/api/Product/GetTheExpensiveProducts/${encodeURIComponent(number)}/${encodeURIComponent(shopcode)}`);
    },
    getWithPagination(payload) {
      return request('/api/Product/GetProductWithPagination', {
        method: 'POST',
        body: payload,
      });
    },
    getById(payload) {
      return request('/api/Product/GetProductById', {
        method: 'POST',
        body: payload,
      });
    },
    add(payload) {
      return request('/api/Product/AddProduct', {
        method: 'POST',
        body: payload,
      });
    },
    update(payload) {
      return request('/api/Product/UpdateProduct', {
        method: 'PUT',
        body: payload,
      });
    },
    remove(payload) {
      return request('/api/Product/DeleteProduct', {
        method: 'DELETE',
        body: payload,
      });
    },
  },

  shop: {
    getById(shopCode) {
      return request(`/api/Shop/GetShopById/${encodeURIComponent(shopCode)}`);
    },
    add(payload) {
      return request('/api/Shop/AddShop', {
        method: 'POST',
        body: payload,
      });
    },
    update(payload) {
      return request('/api/Shop/UpdateShop', {
        method: 'PUT',
        body: payload,
      });
    },
    remove(id) {
      return request(`/api/Shop/DeleteShop/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    getWithUser() {
      return request('/api/Shop/GetShopWithUser');
    },
  },
};
