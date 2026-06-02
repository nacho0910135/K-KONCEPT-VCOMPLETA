export const getErrorMessage = (error, fallback = 'Ocurrio un error inesperado') => {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((item) => [item.field, item.message].filter(Boolean).join(': '))
      .join('. ');
  }

  return error.response?.data?.message || error.message || fallback;
};
