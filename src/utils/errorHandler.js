export const getErrorMessage = (error, fallback = 'Ocurrio un error inesperado') => {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    const message = details
      .map((item) => [item.field, item.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join('. ');
    if (message) return message;
  }

  return error.response?.data?.message || error.message || fallback;
};
