// site/js/services/categories.js
import { apiClient } from './api.js'; // فرض بر اینکه apiClient در api.js تعریف شده

export const getCategories = async () => {
    try {
        const response = await apiClient.get('/Category/GetCategory/1a881749-a3b6-4dad-3f26-08decb8b3712');
        return response.data; // بر اساس ساختار داده شما
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};
