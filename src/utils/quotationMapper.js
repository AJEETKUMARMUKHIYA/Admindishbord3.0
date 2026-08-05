export const mapQuotationToViewModel = (apiData) => {
  const q = apiData?.quotation || apiData || {};
  
  let rawItems = [];
  const candidateSources = [
    apiData?.items,
    q.items,
    q.selectedItems,
    q.bookingItemList,
    q.inventoryList,
    q.inventory,
    q.itemList
  ];

  for (const src of candidateSources) {
    if (Array.isArray(src) && src.length > 0) {
      rawItems = src;
      break;
    }
  }

  // Time slot mapping
  let slotTime = q.slotTime || q.timeSlot || q.selectedTimeSlotName || q.timeSlotName || q.pickupTimeSlot;
  if (!slotTime || typeof slotTime === "number" || slotTime === "—" || slotTime === "-") {
    const defaultSlots = {
      1: "Morning (08:00 AM - 11:00 AM)",
      2: "Afternoon (12:00 PM - 03:00 PM)",
      3: "Evening (04:00 PM - 07:00 PM)",
      4: "Night (08:00 PM - 11:00 PM)"
    };
    const slotId = q.selectedTimeSlot || q.pickupTimeSlotID || q.timeSlotID || slotTime;
    if (slotId && defaultSlots[slotId]) {
      slotTime = defaultSlots[slotId];
    } else {
      slotTime = "Morning (08:00 AM - 11:00 AM)";
    }
  }

  const mappedItems = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems.map((i) => ({
        name: i.itemName || i.name || i.title || i.item_name || "Household Item",
        quantity: i.bookedQuantity ?? i.quantity ?? i.qty ?? i.count ?? 1,
        category: i.category || i.categoryName || "General",
        size: i.sizeCFT || i.cft || 0
      }))
    : [];

  return {
    ...q,
    bookingID: q.bookingID || q.bookingId || q.id,
    bookingId: q.bookingID || q.bookingId || q.id,
    quotationNumber: q.quotationNumber || q.quotationNo || "QTN-84920",
    customerName: q.customerName || q.userName || q.name || "Valued Customer",
    email: q.email || q.userEmail || "info@packyatra.com",
    phone: q.phoneNumber || q.phone || q.userPhone || "+91 90715 35535",
    pickupDate: q.pickupDate || q.shiftingDate || q.bookingDate,
    slotTime: slotTime,
    timeSlot: slotTime,
    fromAddress: q.fromAddress || q.fromLocation || "Bengaluru, Karnataka",
    toAddress: q.toAddress || q.toLocation || "Destination City",
    totalAmount: q.totalAmount || q.totalPrice || q.price || 18500,
    totalVolume: q.totalVolume || q.totalCFT || 350,
    movingType: q.movingType || q.shiftingType || "Packers & Movers Shifting",
    items: mappedItems,
    selectedItems: mappedItems,
    bookingItemList: mappedItems
  };
};
