export const checkoutReviewError = ({ groupCount, handlingFee = 0, discount = 0, coupon = '' }) => {
  if (!Number.isInteger(groupCount) || groupCount < 1) return 'Delivery details must be verified before checkout.';
  if (!Number.isFinite(Number(handlingFee)) || !Number.isFinite(Number(discount))) return 'Checkout totals are invalid. Refresh your cart.';
  if (Number(handlingFee) < 0 || Number(discount) !== 0) {
    return 'Checkout is unavailable until handling fees and promotions are verified by the order service.';
  }
  return '';
};

export const checkoutPolicyError = (checkout) => {
  const error = checkoutReviewError(checkout);
  if (error) return error;
  return '';
};
