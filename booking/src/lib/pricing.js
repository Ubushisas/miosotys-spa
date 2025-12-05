/**
 * Calculate the total price for a service based on number of people
 * Takes into account special package pricing for certain group sizes
 *
 * @param {Object} service - Service object with price and optional packagePricing
 * @param {number} peopleCount - Number of people
 * @returns {number} Total price
 */
export function calculateTotalPrice(service, peopleCount) {
  // If service has package pricing for this specific count, use it
  if (service.packagePricing && service.packagePricing[peopleCount]) {
    return service.packagePricing[peopleCount];
  }

  // Otherwise multiply base price by people count
  if (service.pricePerPerson) {
    return service.price * peopleCount;
  }

  // For services without minPeople (individual services), just return price
  return service.price;
}

/**
 * Calculate the deposit amount (50% of total)
 *
 * @param {Object} service - Service object
 * @param {number} peopleCount - Number of people
 * @returns {number} Deposit amount
 */
export function calculateDeposit(service, peopleCount) {
  const totalPrice = calculateTotalPrice(service, peopleCount);
  return Math.round(totalPrice * 0.5);
}
