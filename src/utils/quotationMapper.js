export const mapQuotationToViewModel = (apiData) => {
  const q = apiData?.quotation || apiData || {};
  const rawItems = apiData?.items || q.items || q.selectedItems || q.bookingItemList || (Array.isArray(apiData) ? apiData : []);

  // Time slot mapping
  let slotTime = q.slotTime || q.timeSlot || q.selectedTimeSlotName || q.timeSlotName || q.pickupTimeSlot;
  if (!slotTime || typeof slotTime === "number") {
    const defaultSlots = {
      1: "Morning (08:00 AM - 11:00 AM)",
      2: "Afternoon (12:00 PM - 03:00 PM)",
      3: "Evening (04:00 PM - 07:00 PM)",
      4: "Night (08:00 PM - 11:00 PM)"
    };
    const slotId = q.selectedTimeSlot || q.pickupTimeSlotID || q.timeSlotID || slotTime;
    if (slotId && defaultSlots[slotId]) {
      slotTime = defaultSlots[slotId];
    }
  }

  return {
    bookingId: q.bookingID || q.bookingId,
    quotationNumber: q.quotationNumber,
    customerName: q.customerName || q.userName || q.name,
    email: q.email || q.userEmail,
    phone: q.phoneNumber || q.phone || q.userPhone,
    pickupDate: q.pickupDate || q.shiftingDate,
    slotTime: slotTime || "—",
    timeSlot: slotTime || "—",
    fromAddress: q.fromAddress || q.fromLocation,
    toAddress: q.toAddress || q.toLocation,
    totalAmount: q.totalAmount || q.totalPrice || q.price,
    totalVolume: q.totalVolume || q.totalCFT,
    movingType: q.movingType || q.shiftingType,
    items: Array.isArray(rawItems)
      ? rawItems.map((i) => ({
          name: i.itemName || i.name || i.title || "Item",
          quantity: i.bookedQuantity ?? i.quantity ?? i.qty ?? 1,
          category: i.category || "General",
          size: i.sizeCFT || i.cft || 0
        }))
      : []
  };
};
