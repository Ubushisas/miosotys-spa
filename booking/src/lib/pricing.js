/**
 * Calculate the total price for a service based on number of people
 * Takes into account special package pricing for certain group sizes
 *
 * @param {Object} service - Service object with price and optional packagePricing
 * @param {number} peopleCount - Number of people
 * @returns {number} Total price
 */
export function calculateTotalPrice(service, peopleCount) {
  // Servicios que se cotizan según el paquete: no tienen precio publicado,
  // así que no se les puede calcular total ni depósito.
  if (service.quoteOnly || service.price == null) {
    return null;
  }

  // Si el conteo no llega (null/undefined/0), se usa el minimo del paquete.
  // Sin esta red, un paquete por persona con peopleCount null da total 0.
  const count = Number(peopleCount) > 0 ? Number(peopleCount) : (service.minPeople || 1);

  // If service has package pricing for this specific count, use it
  if (service.packagePricing && service.packagePricing[count]) {
    return service.packagePricing[count];
  }

  // Otherwise multiply base price by people count
  if (service.pricePerPerson) {
    return service.price * count;
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
  if (totalPrice == null) return null;
  return Math.round(totalPrice * 0.5);
}
