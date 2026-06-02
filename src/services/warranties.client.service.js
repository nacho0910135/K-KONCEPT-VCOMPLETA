import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listMyWarranties = async () => unwrap(await api.get('/warranties/me'));

export const validateWarrantyBySerial = async (productSerial) => unwrap(await api.get('/warranties/validate', {
  params: { productSerial }
}));
