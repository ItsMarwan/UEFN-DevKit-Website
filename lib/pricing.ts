// yes i leaked the prices. will change in the feature. but for now they stay as is,
// system was finished but had issues so i scrapped it for now until i polish the site more

// Premium pricing configuration
export const premiumPricingMonthly: Record<number, number> = {
  1: 9.99,
  2: 17.99,
  3: 24.99,
  4: 31.99,
  5: 38.99,
  6: 47.99,
};

export const premiumPricingYearly = 79.99;

// Discounts for specific durations (special offers)
export const premiumDiscounts: Record<number, number> = {
  6: 44.99,
  11: 69.99,
  12: 69.99,
};