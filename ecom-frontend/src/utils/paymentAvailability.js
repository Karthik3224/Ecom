export const requirePaymentProcessing = async (loadCapabilities) => {
  const capabilities = await loadCapabilities();
  if (capabilities?.processingEnabled !== true) {
    throw new Error(capabilities?.reason || 'Payments are currently unavailable.');
  }
};
