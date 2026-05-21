const successResponse = (res, { data = null, message, pagination, statusCode = 200 } = {}) => {
  const payload = {
    success: true,
    data
  };

  if (message) payload.message = message;
  if (pagination) payload.pagination = pagination;

  return res.status(statusCode).json(payload);
};

module.exports = { successResponse };
