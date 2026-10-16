// Match the order-service write guard; shipment display state cannot authorize a review.
export const reviewEligible = order => order?.status === 'DELIVERED';
