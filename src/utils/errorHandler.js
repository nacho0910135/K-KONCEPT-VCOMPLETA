export const getErrorMessage = (error, fallback = 'Ocurrio un error inesperado') => (
  error.response?.data?.message || error.message || fallback
);
