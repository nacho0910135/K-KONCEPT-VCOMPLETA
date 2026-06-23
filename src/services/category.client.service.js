import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listCategories = async (params = {}) => unwrap(await api.get('/categories', { params }));

export const createCategory = async (payload) => unwrap(await api.post('/categories', payload));

export const updateCategory = async (id, payload) => unwrap(await api.put(`/categories/${id}`, payload));

export const activateCategory = async (id) => unwrap(await api.patch(`/categories/${id}/activate`));

export const deactivateCategory = async (id) => unwrap(await api.patch(`/categories/${id}/deactivate`));

export const deleteCategory = async (id) => unwrap(await api.delete(`/categories/${id}`));

export const createSubcategory = async (categoryId, payload) => unwrap(await api.post(`/categories/${categoryId}/subcategories`, payload));

export const updateSubcategory = async (id, payload) => unwrap(await api.put(`/subcategories/${id}`, payload));

export const activateSubcategory = async (id) => unwrap(await api.patch(`/subcategories/${id}/activate`));

export const deactivateSubcategory = async (id) => unwrap(await api.patch(`/subcategories/${id}/deactivate`));

export const deleteSubcategory = async (id) => unwrap(await api.delete(`/subcategories/${id}`));

export const createProduct = async (payload) => unwrap(await api.post('/products', payload));
