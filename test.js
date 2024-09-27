let promotionDetails = [];

const promociones = [
  { id: '66e3b649f340191d5c85e2ef', monto: 150 },
  { id: '66e3b649f340191d5c85e2ef', monto: 150 },
  { id: '66e3b649f340191d5c85e2ef', monto: 150 },
  { id: '66edae30ff4bcaf1bc25c0a9', nombre: 'new', monto: 130 },
  { id: '66edae30ff4bcaf1bc25c0a9', nombre: 'new', monto: 130 }
];

// If promociones exist and is an array, process them
if (promociones && Array.isArray(promociones)) {
  promociones.forEach(promo => {
    // Check if the promotion already exists in promotionDetails
    const existingPromotion = promotionDetails.find(p => p.promotionId === promo.id);

    if (existingPromotion) {
      // If it exists, update the quantity by adding 1 (or any dynamic value)
      existingPromotion.promotionQuantity += 1; // Increment by 1 each time a duplicate is found
    } else {
      // If not, add it as a new promotion entry with initial quantity of 1
      promotionDetails.push({
        promotionName: promo.nombre,
        promotionPrice: promo.monto,
        promotionId: promo.id,
        promotionQuantity: 1 // Default quantity to 1
      });
    }
  });
}

console.log("promotionDetails", promotionDetails);
