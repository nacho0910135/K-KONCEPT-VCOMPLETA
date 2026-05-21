const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const calculateWarrantyStatus = (startDate, endDate, now = new Date()) => {
  if (!startDate || !endDate) {
    return {
      status: 'NOT_APPLICABLE',
      isValid: false,
      daysRemaining: null
    };
  }

  const today = startOfDay(now);
  const startsAt = startOfDay(startDate);
  const expiresAt = startOfDay(endDate);

  if (today < startsAt) {
    return {
      status: 'NOT_APPLICABLE',
      isValid: false,
      daysRemaining: null
    };
  }

  if (expiresAt < today) {
    return {
      status: 'EXPIRED',
      isValid: false,
      daysRemaining: 0
    };
  }

  return {
    status: 'VALID',
    isValid: true,
    daysRemaining: Math.ceil((expiresAt.getTime() - today.getTime()) / MS_PER_DAY)
  };
};

const buildWarrantyValidationResponse = (warranty, product) => {
  if (!warranty) {
    return {
      isValid: false,
      status: 'NOT_APPLICABLE',
      expiresAt: null,
      daysRemaining: null,
      productInfo: product || null
    };
  }

  const calculated = calculateWarrantyStatus(warranty.startDate, warranty.endDate);

  return {
    isValid: calculated.isValid,
    status: calculated.status,
    expiresAt: warranty.endDate,
    daysRemaining: calculated.daysRemaining,
    productInfo: warranty.product || product || null,
    warrantyId: warranty.id
  };
};

module.exports = { calculateWarrantyStatus, buildWarrantyValidationResponse };
