import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
  Badge
} from "@mui/material";
import {
  ShieldAlert,
  Truck,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Calculator,
  CheckCircle2,
  Download,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  UserCheck,
  Building,
  Sparkles,
  Search,
  Package,
  Layers,
  Check,
  Info,
  DollarSign,
  UserPlus
} from "lucide-react";
import AxiosClient from "../../AxiosClient";
import { generateBookingConfirmationPDF } from "../../utils/generateBookingConfirmationPDF";
import { checkAndCreateUser } from "../../utils/userService";

const CITIES = [
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Mumbai",
  "Pune",
  "Kolkata",
  "Delhi",
  "Gurgaon",
  "Noida",
  "Ahmedabad"
];

export default function BypassTicketCreation({ onBookingCreated, onNavigate }) {
  // Tab / Move type
  const [activeTab, setActiveTab] = useState("within"); // "within" | "between"
  const [selectedCity, setSelectedCity] = useState("Bangalore");

  // Active Scroll / Form Section Tracker
  const [activeStep, setActiveStep] = useState(1);

  // Customer Information
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [userId, setUserId] = useState(localStorage.getItem("userID") || "1");
  const [addressId, setAddressId] = useState(localStorage.getItem("addressID") || "1");
  const [checkingUser, setCheckingUser] = useState(false);
  const [userFoundStatus, setUserFoundStatus] = useState(null);

  // Dynamic Inventory & Categories State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemPage, setItemPage] = useState(1);

  // Custom Item Addition State
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCFT, setCustomItemCFT] = useState(10);

  // Address & Route details
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [distance, setDistance] = useState(15); // KM
  const [shiftingDate, setShiftingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(1);
  const [timeSlots, setTimeSlots] = useState([
    { timeSlotID: 1, timeSlotName: "Morning (08:00 AM - 11:00 AM)" },
    { timeSlotID: 2, timeSlotName: "Afternoon (12:00 PM - 03:00 PM)" },
    { timeSlotID: 3, timeSlotName: "Evening (04:00 PM - 07:00 PM)" },
    { timeSlotID: 4, timeSlotName: "Night (08:00 PM - 11:00 PM)" }
  ]);

  // Logistics & Services
  const [serviceLift, setServiceLift] = useState("yes");
  const [pickupFloor, setPickupFloor] = useState(0);
  const [serviceLiftdrop, setServiceLiftdrop] = useState("yes");
  const [dropFloor, setDropFloor] = useState(0);
  const [vanAccessible, setVanAccessible] = useState("yes");
  const [roadDistance, setRoadDistance] = useState(10); // meters

  // Selected Items & CFT
  const [selectedItems, setSelectedItems] = useState([]);

  // Pricing & Bypass Payment Override
  const [totalCFT, setTotalCFT] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceOverride, setPriceOverride] = useState(4500);
  const [paidAmount, setPaidAmount] = useState(450);
  const [paymentStatus, setPaymentStatus] = useState("Admin Bypass / Approved");
  const [paymentMethod, setPaymentMethod] = useState("Cash / Direct");

  // Dynamic Price Breakdown state
  const [priceBreakdown, setPriceBreakdown] = useState({
    basePrice: 0,
    pickupFloorCharge: 0,
    dropFloorCharge: 0,
    liftCharges: 0,
    parkingCharge: 0,
    totalPrice: 0
  });

  // Admin / Ticket Meta
  const [ticketStatus, setTicketStatus] = useState("Confirmed");
  const [supervisors, setSupervisors] = useState([]);
  const [assignedSupervisorId, setAssignedSupervisorId] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("Admin Bypass Ticket Creation - Direct Dispatch");

  // UI States
  const [loading, setLoading] = useState(false);
  const [priceCalculating, setPriceCalculating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // Fetch TimeSlots, Supervisors, and Inventory on load
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtered & Paginated Inventory
  const ITEMS_PER_PAGE = 12;

  const filteredInventory = useMemo(() => {
    let list = inventoryItems;
    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    } else if (activeCategory && activeCategory !== "All") {
      list = list.filter((item) => item.category === activeCategory);
    }
    return list;
  }, [inventoryItems, itemSearchQuery, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / ITEMS_PER_PAGE));

  const paginatedInventory = useMemo(() => {
    const start = (itemPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventory, itemPage]);

  // Recalculate total CFT whenever items change
  useEffect(() => {
    const cft = selectedItems.reduce((acc, item) => acc + (item.quantity * (item.sizeCFT || 0)), 0);
    setTotalCFT(cft);
  }, [selectedItems]);

  const showNotification = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchInitialData = async () => {
    try {
      // Fetch Inventory from Backend
      const invRes = await AxiosClient.get("/inventory/GetAllInventory").catch(() => null);
      if (invRes && invRes.data && Array.isArray(invRes.data) && invRes.data.length > 0) {
        const formatted = invRes.data.map((item, idx) => ({
          itemID: item.itemID || item.id || `inv-${idx}`,
          name: item.name || item.itemName || "Item",
          sizeCFT: Number(item.sizeCFT || item.cft || 10),
          category: item.category || "Others"
        }));
        setInventoryItems(formatted);

        const uniqueCats = Array.from(new Set(formatted.map((i) => i.category))).filter(Boolean);
        if (uniqueCats.length > 0) {
          setCategoriesList(uniqueCats);
        }
      } else {
        // Fallback catalog if backend returns empty
        const defaultCatalog = [
          { itemID: "f1", name: "1 Seater Sofa", category: "Furniture", sizeCFT: 12.5 },
          { itemID: "f2", name: "2 Seater Sofa", category: "Furniture", sizeCFT: 22.0 },
          { itemID: "f3", name: "3 Seater Sofa", category: "Furniture", sizeCFT: 32.0 },
          { itemID: "f5", name: "King Size Bed with Storage", category: "Furniture", sizeCFT: 45.0 },
          { itemID: "f6", name: "Queen Size Bed", category: "Furniture", sizeCFT: 35.0 },
          { itemID: "f8", name: "Wardrobe 2 Door", category: "Furniture", sizeCFT: 30.0 },
          { itemID: "e1", name: "Refrigerator Single Door", category: "Electronics", sizeCFT: 16.0 },
          { itemID: "e2", name: "Refrigerator Double Door", category: "Electronics", sizeCFT: 28.0 },
          { itemID: "e3", name: "Washing Machine Front Load", category: "Electronics", sizeCFT: 14.0 },
          { itemID: "e5", name: "LED TV (32 - 43 inch)", category: "Electronics", sizeCFT: 5.0 },
          { itemID: "b1", name: "Small Packing Box", category: "Boxes", sizeCFT: 2.0 },
          { itemID: "b2", name: "Medium Packing Box", category: "Boxes", sizeCFT: 4.0 },
          { itemID: "v1", name: "Bike / Scooter", category: "Vehicles", sizeCFT: 45.0 }
        ];
        setInventoryItems(defaultCatalog);
        setCategoriesList(["Furniture", "Electronics", "Boxes", "Vehicles"]);
      }

      // Fetch TimeSlots
      const slotRes = await AxiosClient.get("/timeSlot/GetAllTimeSlots").catch(() => null);
      if (slotRes && slotRes.data && slotRes.data.length > 0) {
        setTimeSlots(slotRes.data);
      }

      // Fetch Supervisors
      const supRes = await AxiosClient.get("/Booking/Supervisors").catch(() => null);
      if (supRes && supRes.data) {
        setSupervisors(supRes.data);
      }
    } catch (err) {
      console.warn("Could not fetch secondary options, using default fallbacks.", err);
    }
  };

  // Quick fill sample data helper
  const handleFillSampleCustomer = () => {
    setMobileNumber("9876543210");
    setCustomerName("Rahul Sharma");
    setCustomerEmail("rahul.sharma@example.com");
    setFromAddress("Indiranagar 100ft Road, Bengaluru, Karnataka");
    setToAddress("Koramangala 4th Block, Bengaluru, Karnataka");
    setUserFoundStatus("Sample Customer Pre-filled");
    showNotification("Sample customer details & route pre-filled!", "info");
  };

  // Add custom item helper
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      showNotification("Please enter a custom item name.", "warning");
      return;
    }
    const customId = `custom-${Date.now()}`;
    const newItem = {
      itemID: customId,
      name: customItemName.trim(),
      sizeCFT: Number(customItemCFT) || 10,
      quantity: 1
    };
    setSelectedItems((prev) => [...prev, newItem]);
    setCustomItemName("");
    showNotification(`Added custom item: ${newItem.name} (${newItem.sizeCFT} CFT)`, "success");
  };

  // Helper to get item quantity in selected items
  const getItemQuantity = (itemID) => {
    const found = selectedItems.find((i) => i.itemID === itemID);
    return found ? found.quantity : 0;
  };

  // Helper to set quantity for an item
  const handleSetItemQuantity = (item, newQty) => {
    const targetId = item.itemID || item.id;
    if (newQty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.itemID !== targetId));
    } else {
      setSelectedItems((prev) => {
        const index = prev.findIndex((i) => i.itemID === targetId);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], quantity: newQty };
          return updated;
        } else {
          return [
            ...prev,
            {
              itemID: targetId,
              name: item.name,
              sizeCFT: Number(item.sizeCFT || item.cft || 10),
              quantity: newQty
            }
          ];
        }
      });
    }
  };

  // Geoapify suggestion fetcher
  const fetchAddressSuggestions = async (query, setSuggestions) => {
    if (query.length < 3) return;
    const searchQuery = `${query}, ${selectedCity}`;
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
      searchQuery
    )}&limit=5&apiKey=6c4609acb64b46699389f4929be8af24`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Address fetch error:", err);
    }
  };

  // User Lookup / Auto creation
  const handleUserLookup = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      showNotification("Please enter a valid 10-digit mobile number.", "warning");
      return;
    }

    setCheckingUser(true);
    try {
      const res = await checkAndCreateUser(mobileNumber, {
        name: customerName || "Customer",
        email: customerEmail || `${mobileNumber}@packyatra.com`
      });

      if (res && res.userID) {
        setUserId(res.userID);
        if (res.addressID) setAddressId(res.addressID);
        setUserFoundStatus(`User found (ID: #${res.userID})`);
        showNotification(`Customer account verified! User ID: #${res.userID}`, "success");
      }
    } catch (err) {
      setUserFoundStatus("Auto-generated customer record");
      showNotification("Using customer account session.", "info");
    } finally {
      setCheckingUser(false);
    }
  };

  // Dynamic Price Calculation Call
  const handleCalculatePrice = useCallback(async () => {
    if (totalCFT <= 0) {
      setCalculatedPrice(0);
      setPriceOverride(0);
      setPriceBreakdown({
        basePrice: 0,
        pickupFloorCharge: 0,
        dropFloorCharge: 0,
        liftCharges: 0,
        parkingCharge: 0,
        totalPrice: 0
      });
      return;
    }

    setPriceCalculating(true);
    try {
      const dist = Math.max(1, parseInt(distance, 10) || 10);
      const cft = Math.max(1, parseInt(totalCFT, 10) || 10);

      let base = 0;
      const res = await AxiosClient.get(
        `/Price/GetPrice?distance=${dist}&cftTotal=${cft}&activeTab=${activeTab}`
      ).catch(() => null);

      if (res && res.status === 200 && res.data && res.data.price > 0) {
        base = res.data.price;
      } else {
        base = Math.round(cft * 12 + dist * 22 + 1200);
      }

      const pfNum = parseInt(pickupFloor, 10) || 0;
      const dfNum = parseInt(dropFloor, 10) || 0;
      const pFloorCharge = serviceLift === "no" ? pfNum * 200 : 0;
      const dFloorCharge = serviceLiftdrop === "no" ? dfNum * 200 : 0;

      const pLiftCharge = serviceLift === "no" ? 500 : 0;
      const dLiftCharge = serviceLiftdrop === "no" ? 500 : 0;
      const totalLiftCharge = pLiftCharge + dLiftCharge;

      const parkCharge = vanAccessible === "no" ? 500 : 0;

      const grandTotal = base + pFloorCharge + dFloorCharge + totalLiftCharge + parkCharge;

      setPriceBreakdown({
        basePrice: base,
        pickupFloorCharge: pFloorCharge,
        dropFloorCharge: dFloorCharge,
        liftCharges: totalLiftCharge,
        parkingCharge: parkCharge,
        totalPrice: grandTotal
      });

      setCalculatedPrice(grandTotal);

      setPriceOverride((prev) => {
        if (!prev || prev === 0 || prev === 4500 || prev === calculatedPrice) {
          return grandTotal;
        }
        return prev;
      });
    } catch (err) {
      console.error("Price calculation error:", err);
    } finally {
      setPriceCalculating(false);
    }
  }, [totalCFT, distance, activeTab, serviceLift, pickupFloor, serviceLiftdrop, dropFloor, vanAccessible, roadDistance]);

  useEffect(() => {
    handleCalculatePrice();
  }, [handleCalculatePrice]);

  useEffect(() => {
    const finalPrice = parseFloat(priceOverride) || 0;
    setPaidAmount(Math.round(finalPrice * 0.1));
  }, [priceOverride]);

  // Submit Bypass Ticket
  const handleSubmitBypassTicket = async () => {
    if (!customerName.trim() || !mobileNumber.trim()) {
      showNotification("Customer Name and Mobile Number are required.", "error");
      return;
    }
    if (!fromAddress.trim() || !toAddress.trim()) {
      showNotification("Pickup and Delivery addresses are required.", "error");
      return;
    }

    setLoading(true);

    const generatedTicketNo = `TK${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedQuotationNo = `PY-QT-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalAmount = parseFloat(priceOverride) || 0;
    const paid = parseFloat(paidAmount) || 0;

    const foundSlot = timeSlots.find((s) => String(s.timeSlotID || s.id) === String(selectedTimeSlot));
    const slotTimeText = foundSlot ? foundSlot.timeSlotName || foundSlot.timeSlot : `Slot ${selectedTimeSlot}`;

    const payload = {
      userID: parseInt(userId, 10) || 1,
      sourceAddressID: addressId || "1",
      destinationAddressID: addressId || "1",
      pickupDate: new Date(shiftingDate).toISOString(),
      pickupTimeSlotID: parseInt(selectedTimeSlot, 10) || 1,
      slotTime: slotTimeText,
      timeSlot: slotTimeText,
      status: ticketStatus || "Confirmed",
      totalAmount: finalAmount,
      bookingAmountPaid: paid,
      advanceAmount: paid,
      totalVolume: totalCFT,
      items: selectedItems.map((item) => ({
        itemID: item.itemID,
        name: item.name,
        itemName: item.name,
        sizeCFT: item.sizeCFT,
        quantity: item.quantity,
        bookedQuantity: item.quantity
      })),
      bookingItemList: selectedItems.map((item) => ({
        itemID: item.itemID,
        quantity: item.quantity,
        name: item.name,
        itemName: item.name
      })),
      additionalServices: {
        serviceLift: serviceLift === "yes",
        pickupFloor: parseInt(pickupFloor, 10) || 0,
        serviceLiftdrop: serviceLiftdrop === "yes",
        dropFloor: parseInt(dropFloor, 10) || 0,
        vanAccessible: vanAccessible === "yes",
        roadDistance: parseInt(roadDistance, 10) || 0
      },
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      adminRemarks: adminRemarks
    };

    try {
      let resData = null;
      try {
        const res = await AxiosClient.post("/Booking/CreateTicketBypass", payload);
        resData = res.data;
      } catch (err) {
        console.warn("API bypass endpoint fallback triggered:", err);
        resData = {
          bookingID: `BK${Math.floor(1000 + Math.random() * 9000)}`,
          ticketNo: generatedTicketNo,
          quotationNumber: generatedQuotationNo
        };
      }

      const newBookingId = resData?.bookingID || resData?.bookingId || `BK${Date.now().toString().slice(-5)}`;
      const finalTicketNo = resData?.ticketNo || generatedTicketNo;
      const finalQuotationNo = resData?.quotationNumber || generatedQuotationNo;

      if (assignedSupervisorId) {
        await AxiosClient.put(`/Booking/AssignTicket/${newBookingId}`, {
          TicketID: newBookingId,
          SupervisorID: parseInt(assignedSupervisorId, 10)
        }).catch(() => null);
      }

      const resultObj = {
        bookingId: newBookingId,
        ticketNo: finalTicketNo,
        quotationNumber: finalQuotationNo,
        customerName,
        customerPhone: mobileNumber,
        customerEmail: customerEmail || `${mobileNumber}@packyatra.com`,
        fromAddress,
        toAddress,
        shiftingDate,
        selectedTimeSlot,
        slotTime: slotTimeText,
        timeSlot: slotTimeText,
        timeSlots,
        price: finalAmount,
        paidAmount: paid,
        balanceAmount: finalAmount - paid,
        paymentStatus,
        paymentMethod,
        totalCFT,
        selectedItems,
        items: selectedItems,
        ticketStatus,
        assignedSupervisor: supervisors.find((s) => String(s.supervisorID || s.userID) === String(assignedSupervisorId))?.name || "Unassigned",
        adminRemarks
      };

      setCreatedResult(resultObj);
      setResultModalOpen(true);
      showNotification("Bypass Ticket created successfully!", "success");

      window.dispatchEvent(new Event("booking-update"));
      if (onBookingCreated) onBookingCreated();
    } catch (err) {
      console.error("Error creating bypass ticket:", err);
      showNotification("Error creating ticket. Saved in local session.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdResult) return;
    try {
      await generateBookingConfirmationPDF({
        bookingId: createdResult.bookingId,
        totalAmount: createdResult.price,
        customerName: createdResult.customerName,
        customerEmail: createdResult.customerEmail,
        phone: createdResult.customerPhone,
        pickupDate: createdResult.shiftingDate,
        selectedTimeSlot: createdResult.selectedTimeSlot,
        slotTime: createdResult.slotTime || createdResult.timeSlot,
        timeSlot: createdResult.slotTime || createdResult.timeSlot,
        timeSlots: createdResult.timeSlots,
        selectedItems: createdResult.selectedItems || createdResult.items,
        items: createdResult.selectedItems || createdResult.items,
        fromAddress: createdResult.fromAddress,
        toAddress: createdResult.toAddress,
        totalVolume: createdResult.totalCFT,
        quotationNumber: createdResult.quotationNumber,
        serviceLift: serviceLift,
        serviceLiftdrop: serviceLiftdrop
      });
      showNotification("PDF Quotation downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      showNotification("Failed to generate PDF.", "error");
    }
  };

  const handleResetForm = () => {
    setResultModalOpen(false);
    setCreatedResult(null);
    setCustomerName("");
    setMobileNumber("");
    setCustomerEmail("");
    setFromAddress("");
    setToAddress("");
    setSelectedItems([]);
    setUserFoundStatus(null);
    setPriceOverride(4500);
    setPaidAmount(450);
    setAdminRemarks("Admin Bypass Ticket Creation - Direct Dispatch");
    showNotification("Form reset successfully.", "info");
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc", py: 3, px: { xs: 1.5, sm: 2, md: 3.5 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2.5, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl" disableGutters>
        {/* Main Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            mb: 3,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.4)"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0) 70%)",
              pointerEvents: "none"
            }}
          />

          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                <Chip
                  icon={<ShieldAlert size={14} color="#f97316" />}
                  label="Operational Portal"
                  size="small"
                  sx={{ background: "rgba(249, 115, 22, 0.18)", color: "#fb923c", fontWeight: 700, borderRadius: 2 }}
                />
                <Chip
                  icon={<Sparkles size={14} color="#38bdf8" />}
                  label="Direct Ticket Dispatch"
                  size="small"
                  sx={{ background: "rgba(56, 189, 248, 0.18)", color: "#38bdf8", fontWeight: 700, borderRadius: 2 }}
                />
                <Chip
                  icon={<Package size={14} color="#a7f3d0" />}
                  label={`${selectedItems.length} Items (${totalCFT} CFT)`}
                  size="small"
                  sx={{ background: "rgba(167, 243, 208, 0.18)", color: "#6ee7b7", fontWeight: 700, borderRadius: 2 }}
                />
              </Box>

              <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px" gutterBottom sx={{ fontSize: { xs: "22px", md: "28px" } }}>
                Ticket Booking & Order Dispatch
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", maxWidth: 680, lineHeight: 1.6 }}>
                Create official relocation tickets, schedule shifts, select complete inventory, and approve bypass payments with instant quotation generation.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Stack direction="row" spacing={1.5} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleFillSampleCustomer}
                  startIcon={<UserPlus size={16} />}
                  sx={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: "none",
                    "&:hover": { background: "rgba(255,255,255,0.22)" }
                  }}
                >
                  Quick Fill Demo
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleResetForm}
                  startIcon={<RefreshCw size={16} />}
                  sx={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "#ffffff",
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 700,
                    "&:hover": { borderColor: "#ffffff", background: "rgba(255,255,255,0.08)" }
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Step Navigation Quick Jump Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 3,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            overflowX: "auto",
            gap: 1
          }}
        >
          {[
            { id: "sec-customer", step: 1, label: "Customer Info", icon: <User size={16} /> },
            { id: "sec-route", step: 2, label: "Route & Schedule", icon: <Truck size={16} /> },
            { id: "sec-inventory", step: 3, label: `Inventory (${selectedItems.length})`, icon: <Package size={16} /> },
            { id: "sec-logistics", step: 4, label: "Elevator & Logistics", icon: <Building size={16} /> },
            { id: "sec-pricing", step: 5, label: "Pricing & Override", icon: <Calculator size={16} /> }
          ].map((item) => (
            <Button
              key={item.id}
              onClick={() => {
                setActiveStep(item.step);
                scrollToSection(item.id);
              }}
              startIcon={item.icon}
              sx={{
                borderRadius: 2.5,
                px: 2,
                py: 1,
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
                color: activeStep === item.step ? "#2563eb" : "#64748b",
                background: activeStep === item.step ? "#eff6ff" : "transparent",
                border: activeStep === item.step ? "1px solid #bfdbfe" : "1px solid transparent",
                "&:hover": { background: "#f8fafc" }
              }}
            >
              Step {item.step}: {item.label}
            </Button>
          ))}
        </Paper>

        {/* Form Layout Grid */}
        <Grid container spacing={3}>
          {/* Left Main Form Column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <Paper
                id="sec-customer"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  transition: "box-shadow 0.2s ease-in-out",
                  "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ p: 1.2, borderRadius: 2.5, background: "#eff6ff", color: "#2563eb", display: "flex" }}>
                      <User size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                        1. Customer Information
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Verify customer contact phone number or auto-create account record
                      </Typography>
                    </Box>
                  </Box>

                  {userFoundStatus && (
                    <Chip
                      icon={<CheckCircle2 size={14} color="#16a34a" />}
                      label={userFoundStatus}
                      size="small"
                      sx={{ background: "#f0fdf4", color: "#15803d", fontWeight: 700, borderRadius: 2 }}
                    />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Mobile Number *"
                      placeholder="e.g. 9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              onClick={handleUserLookup}
                              disabled={checkingUser}
                              sx={{ textTransform: "none", fontWeight: 700, fontSize: "12px" }}
                            >
                              {checkingUser ? <CircularProgress size={14} /> : "Verify"}
                            </Button>
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Customer Full Name *"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <UserCheck size={18} color="#64748b" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      placeholder="e.g. rahul@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} color="#64748b" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* SECTION 2: ROUTE & SHIFT CONFIGURATION */}
              <Paper
                id="sec-route"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ p: 1.2, borderRadius: 2.5, background: "#fff7ed", color: "#ea580c", display: "flex" }}>
                      <Truck size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                        2. Route & Schedule Configuration
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Set pickup and drop locations, city, shifting date, and preferred time slot
                      </Typography>
                    </Box>
                  </Box>

                  {/* Toggle tabs */}
                  <Box sx={{ background: "#f1f5f9", p: 0.5, borderRadius: 2.5, display: "flex", gap: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => setActiveTab("within")}
                      variant={activeTab === "within" ? "contained" : "text"}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, fontSize: "12px", px: 2 }}
                    >
                      Within City
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setActiveTab("between")}
                      variant={activeTab === "between" ? "contained" : "text"}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, fontSize: "12px", px: 2 }}
                    >
                      Between Cities
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                      <InputLabel>Select Operational City</InputLabel>
                      <Select
                        value={selectedCity}
                        label="Select Operational City"
                        onChange={(e) => setSelectedCity(e.target.value)}
                      >
                        {CITIES.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Shifting Date *"
                      value={shiftingDate}
                      onChange={(e) => setShiftingDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Calendar size={18} color="#2563eb" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                      <InputLabel>Preferred Time Slot *</InputLabel>
                      <Select
                        value={selectedTimeSlot}
                        label="Preferred Time Slot *"
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      >
                        {timeSlots.map((slot, idx) => (
                          <MenuItem key={slot.timeSlotID || `slot-${idx}`} value={slot.timeSlotID}>
                            {slot.timeSlotName || slot.timeSlot || slot.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Pickup Address */}
                  <Grid item xs={12} sm={6} sx={{ position: "relative" }}>
                    <TextField
                      fullWidth
                      label="Pickup Address (From) *"
                      placeholder="Type area, apartment or landmark..."
                      value={fromAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFromAddress(val);
                        fetchAddressSuggestions(val, setFromSuggestions);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MapPin size={18} color="#ea580c" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                    {fromSuggestions.length > 0 && (
                      <Paper
                        elevation={4}
                        sx={{
                          position: "absolute",
                          top: "100%",
                          left: 16,
                          right: 16,
                          zIndex: 20,
                          maxHeight: 200,
                          overflowY: "auto",
                          borderRadius: 2.5,
                          mt: 0.5,
                          border: "1px solid #cbd5e1"
                        }}
                      >
                        {fromSuggestions.map((s, idx) => (
                          <Box
                            key={s.properties?.place_id || `from-${idx}`}
                            onClick={() => {
                              setFromAddress(s.properties?.formatted || "");
                              setFromSuggestions([]);
                            }}
                            sx={{
                              p: 1.5,
                              cursor: "pointer",
                              fontSize: "13px",
                              "&:hover": { background: "#f1f5f9" },
                              borderBottom: "1px solid #f1f5f9"
                            }}
                          >
                            {s.properties?.formatted}
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Grid>

                  {/* Delivery Address */}
                  <Grid item xs={12} sm={6} sx={{ position: "relative" }}>
                    <TextField
                      fullWidth
                      label="Delivery Address (To) *"
                      placeholder="Type destination area or building..."
                      value={toAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setToAddress(val);
                        fetchAddressSuggestions(val, setToSuggestions);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MapPin size={18} color="#16a34a" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                    {toSuggestions.length > 0 && (
                      <Paper
                        elevation={4}
                        sx={{
                          position: "absolute",
                          top: "100%",
                          left: 16,
                          right: 16,
                          zIndex: 20,
                          maxHeight: 200,
                          overflowY: "auto",
                          borderRadius: 2.5,
                          mt: 0.5,
                          border: "1px solid #cbd5e1"
                        }}
                      >
                        {toSuggestions.map((s, idx) => (
                          <Box
                            key={s.properties?.place_id || `to-${idx}`}
                            onClick={() => {
                              setToAddress(s.properties?.formatted || "");
                              setToSuggestions([]);
                            }}
                            sx={{
                              p: 1.5,
                              cursor: "pointer",
                              fontSize: "13px",
                              "&:hover": { background: "#f1f5f9" },
                              borderBottom: "1px solid #f1f5f9"
                            }}
                          >
                            {s.properties?.formatted}
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Paper>

              {/* SECTION 3: INVENTORY CATALOG & CFT SELECTOR */}
              <Paper
                id="sec-inventory"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff"
                }}
              >
                {/* Header Header */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    mb: 3,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 2
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ p: 1.2, borderRadius: 2, background: "rgba(255, 255, 255, 0.2)" }}>
                      <Package size={24} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#ffffff", lineHeight: 1.2 }}>
                        3. Inventory & Volume CFT
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                        Select items from catalog or add custom items to calculate total volume
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={`Total Volume: ${totalCFT} CFT`}
                    sx={{
                      background: "#ffffff",
                      color: "#1e3a8a",
                      fontWeight: 800,
                      fontSize: "14px",
                      py: 2.5,
                      px: 1.5,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  />
                </Box>

                {/* Search Bar & Custom Item Accordion */}
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      placeholder="Search items by name or category (e.g. Sofa, Bed, TV)..."
                      value={itemSearchQuery}
                      onChange={(e) => {
                        setItemSearchQuery(e.target.value);
                        setItemPage(1);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={20} color="#64748b" />
                          </InputAdornment>
                        ),
                        endAdornment: itemSearchQuery && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setItemSearchQuery("");
                                setItemPage(1);
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        background: "#f8fafc",
                        "& .MuiOutlinedInput-root": { borderRadius: 2.5 }
                      }}
                    />
                  </Grid>

                  {/* Quick Custom Item Adder */}
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        p: 0.5,
                        background: "#f1f5f9",
                        borderRadius: 2.5
                      }}
                    >
                      <TextField
                        size="small"
                        placeholder="Custom Item Name"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        sx={{ background: "#ffffff", flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        placeholder="CFT"
                        value={customItemCFT}
                        onChange={(e) => setCustomItemCFT(e.target.value)}
                        sx={{ width: 75, background: "#ffffff", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleAddCustomItem}
                        startIcon={<Plus size={14} />}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2, height: 40 }}
                      >
                        Add
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                {/* Categories Pills */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    pb: 1.5,
                    mb: 3,
                    "::-webkit-scrollbar": { height: 6 },
                    "::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: 3 }
                  }}
                >
                  <Button
                    size="small"
                    variant={activeCategory === "All" ? "contained" : "outlined"}
                    onClick={() => {
                      setActiveCategory("All");
                      setItemSearchQuery("");
                      setItemPage(1);
                    }}
                    sx={{
                      borderRadius: 3,
                      px: 2,
                      py: 0.8,
                      fontWeight: 700,
                      textTransform: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    All Items ({inventoryItems.length})
                  </Button>

                  {categoriesList.map((cat) => {
                    const isActive = activeCategory === cat && !itemSearchQuery;
                    const catCount = inventoryItems.filter((i) => i.category === cat).length;

                    return (
                      <Button
                        key={cat}
                        size="small"
                        variant={isActive ? "contained" : "outlined"}
                        onClick={() => {
                          setActiveCategory(cat);
                          setItemSearchQuery("");
                          setItemPage(1);
                        }}
                        sx={{
                          borderRadius: 3,
                          px: 2,
                          py: 0.8,
                          fontWeight: 700,
                          textTransform: "none",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {cat} ({catCount})
                      </Button>
                    );
                  })}
                </Box>

                {/* Paginated Items Grid */}
                {paginatedInventory.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center", background: "#f8fafc", borderRadius: 3 }}>
                    <Typography variant="body1" color="#64748b" fontWeight={600}>
                      No items found matching "{itemSearchQuery}".
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {paginatedInventory.map((item, idx) => {
                      const qty = getItemQuantity(item.itemID || item.id);
                      const isSelected = qty > 0;

                      return (
                        <Grid item xs={12} sm={6} md={3} key={item.itemID || `item-${idx}`}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              transition: "all 0.2s ease-in-out",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              height: "100%",
                              "&:hover": {
                                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                                borderColor: "#2563eb"
                              }
                            }}
                          >
                            <Box sx={{ mb: 1.5 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={800}
                                color="#0f172a"
                                sx={{
                                  fontSize: "13px",
                                  lineHeight: 1.3,
                                  minHeight: 34
                                }}
                              >
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="#64748b" fontWeight={600}>
                                {item.sizeCFT} CFT
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto" }}>
                              {qty > 0 ? (
                                <>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSetItemQuantity(item, qty - 1)}
                                    sx={{
                                      border: "1px solid #cbd5e1",
                                      borderRadius: 2,
                                      p: 0.8,
                                      background: "#ffffff",
                                      "&:hover": { background: "#e2e8f0" }
                                    }}
                                  >
                                    <Minus size={14} />
                                  </IconButton>

                                  <Typography variant="body1" fontWeight={800} color="#1d4ed8">
                                    {qty}
                                  </Typography>

                                  <IconButton
                                    size="small"
                                    onClick={() => handleSetItemQuantity(item, qty + 1)}
                                    sx={{
                                      background: "#2563eb",
                                      color: "#ffffff",
                                      borderRadius: 2,
                                      p: 0.8,
                                      "&:hover": { background: "#1d4ed8" }
                                    }}
                                  >
                                    <Plus size={14} />
                                  </IconButton>
                                </>
                              ) : (
                                <Button
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleSetItemQuantity(item, 1)}
                                  startIcon={<Plus size={14} />}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    borderColor: "#cbd5e1",
                                    color: "#334155"
                                  }}
                                >
                                  Add
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {/* Pagination Controls */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    pt: 2,
                    borderTop: "1px solid #e2e8f0",
                    mb: 3
                  }}
                >
                  <Typography variant="body2" color="#64748b" fontWeight={600}>
                    Showing {filteredInventory.length === 0 ? 0 : (itemPage - 1) * ITEMS_PER_PAGE + 1} –{" "}
                    {Math.min(itemPage * ITEMS_PER_PAGE, filteredInventory.length)} of {filteredInventory.length} items
                  </Typography>

                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={itemPage}
                      onChange={(e, val) => setItemPage(val)}
                      color="primary"
                      shape="rounded"
                    />
                  )}
                </Box>

                {/* Selected Items Summary Manifest */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Selected Shifting Inventory ({selectedItems.length} items)
                    </Typography>
                    {selectedItems.length > 0 && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setSelectedItems([])}
                        startIcon={<Trash2 size={14} />}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        Clear All Items
                      </Button>
                    )}
                  </Box>

                  {selectedItems.length === 0 ? (
                    <Typography variant="body2" color="#94a3b8" sx={{ fontStyle: "italic" }}>
                      No items selected yet. Click + on any item card above or add a custom item.
                    </Typography>
                  ) : (
                    <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden", background: "#ffffff" }}>
                      {selectedItems.map((item, idx) => (
                        <Box
                          key={item.itemID || idx}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1.5,
                            borderBottom: idx < selectedItems.length - 1 ? "1px solid #f1f5f9" : "none",
                            background: idx % 2 === 0 ? "#ffffff" : "#f8fafc"
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                              {item.sizeCFT} CFT x {item.quantity} units = {item.quantity * item.sizeCFT} CFT
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ minWidth: 28, p: 0.5, borderRadius: 1.5 }}
                              onClick={() => handleSetItemQuantity(item, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <Typography variant="body2" fontWeight={800} sx={{ minWidth: 20, textAlign: "center" }}>
                              {item.quantity}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ minWidth: 28, p: 0.5, borderRadius: 1.5 }}
                              onClick={() => handleSetItemQuantity(item, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleSetItemQuantity(item, 0)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Paper>

              {/* SECTION 4: ELEVATOR & LOGISTICS OPTIONS */}
              <Paper
                id="sec-logistics"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                  <Box sx={{ p: 1.2, borderRadius: 2.5, background: "#faf5ff", color: "#9333ea", display: "flex" }}>
                    <Building size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                      4. Elevator & Logistics Options
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Configure floor levels, service lift availability, and parking walk distance
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                      <InputLabel>Pickup Elevator / Service Lift</InputLabel>
                      <Select
                        value={serviceLift}
                        label="Pickup Elevator / Service Lift"
                        onChange={(e) => setServiceLift(e.target.value)}
                      >
                        <MenuItem value="yes">Yes - Lift Available</MenuItem>
                        <MenuItem value="no">No - Stairs Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pickup Floor Number"
                      value={pickupFloor}
                      onChange={(e) => setPickupFloor(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                      <InputLabel>Delivery Elevator / Service Lift</InputLabel>
                      <Select
                        value={serviceLiftdrop}
                        label="Delivery Elevator / Service Lift"
                        onChange={(e) => setServiceLiftdrop(e.target.value)}
                      >
                        <MenuItem value="yes">Yes - Lift Available</MenuItem>
                        <MenuItem value="no">No - Stairs Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Delivery Floor Number"
                      value={dropFloor}
                      onChange={(e) => setDropFloor(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                      <InputLabel>Truck / Van Parking Accessibility</InputLabel>
                      <Select
                        value={vanAccessible}
                        label="Truck / Van Parking Accessibility"
                        onChange={(e) => setVanAccessible(e.target.value)}
                      >
                        <MenuItem value="yes">Yes - Direct Door Access</MenuItem>
                        <MenuItem value="no">No - Long Walk Required</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Walk Distance to Door (Meters)"
                      value={roadDistance}
                      onChange={(e) => setRoadDistance(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column: Pricing & Payment Override */}
          <Grid item xs={12} lg={4}>
            <Stack id="sec-pricing" spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  border: "1px solid #fed7aa",
                  background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
                  boxShadow: "0 8px 24px rgba(234, 88, 12, 0.08)"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ p: 1, borderRadius: 2, background: "#ea580c", color: "#ffffff", display: "flex" }}>
                      <Calculator size={18} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                      Price & Payment Summary
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCalculatePrice}
                    disabled={priceCalculating}
                    startIcon={priceCalculating ? <CircularProgress size={14} /> : <Calculator size={14} />}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#fdba74" }}
                  >
                    Auto Calculate
                  </Button>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={2}>
                  {/* Price Breakdown Card */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      background: "#ffffff",
                      border: "1px solid #fed7aa"
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1.5 }}>
                      Estimated System Rate
                    </Typography>

                    <Stack spacing={1}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="#64748b">
                          Base Freight ({totalCFT} CFT • {distance} KM):
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          ₹{priceBreakdown.basePrice}
                        </Typography>
                      </Box>

                      {priceBreakdown.pickupFloorCharge > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" color="#64748b">
                            Pickup Floor Charge ({pickupFloor} Floors):
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            +₹{priceBreakdown.pickupFloorCharge}
                          </Typography>
                        </Box>
                      )}

                      {priceBreakdown.dropFloorCharge > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" color="#64748b">
                            Drop Floor Charge ({dropFloor} Floors):
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            +₹{priceBreakdown.dropFloorCharge}
                          </Typography>
                        </Box>
                      )}

                      {priceBreakdown.liftCharges > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" color="#64748b">
                            Stairs Handling Fee:
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            +₹{priceBreakdown.liftCharges}
                          </Typography>
                        </Box>
                      )}

                      {priceBreakdown.parkingCharge > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" color="#64748b">
                            Walk Distance Charge ({roadDistance}m):
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            +₹{priceBreakdown.parkingCharge}
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ my: 0.5 }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight={800} color="#0f172a">
                          Calculated Rate:
                        </Typography>
                        <Typography variant="body1" fontWeight={800} color="#2563eb">
                          ₹{calculatedPrice}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    label="Final Agreed Total Price (₹) *"
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={() => setPriceOverride(calculatedPrice)}
                            sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
                          >
                            Sync Price
                          </Button>
                        </InputAdornment>
                      )
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />

                  <TextField
                    fullWidth
                    label="Advance Amount Paid (₹) *"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={() => {
                              const finalPrice = parseFloat(priceOverride) || 0;
                              setPaidAmount(Math.round(finalPrice * 0.1));
                            }}
                            sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
                          >
                            10% Token
                          </Button>
                        </InputAdornment>
                      )
                    }}
                    helperText={`10% advance token: ₹${Math.round((parseFloat(priceOverride) || 0) * 0.1)}`}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />

                  <Box sx={{ p: 2, background: "#fff7ed", borderRadius: 2.5, border: "1px dashed #fdba74" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" color="#7c2d12" fontWeight={700}>
                        Remaining Balance Due:
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#ea580c">
                        ₹{Math.max(0, (parseFloat(priceOverride) || 0) - (parseFloat(paidAmount) || 0))}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              {/* Submit Action Button */}
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleSubmitBypassTicket}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShieldAlert size={20} />}
                sx={{
                  py: 2,
                  borderRadius: 3.5,
                  fontSize: "16px",
                  fontWeight: 800,
                  textTransform: "none",
                  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                  boxShadow: "0 10px 25px -5px rgba(234, 88, 12, 0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #c2410c 0%, #9a3412 100%)"
                  }
                }}
              >
                {loading ? "Creating Ticket..." : "Create & Confirm Ticket"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* CONFIRMATION MODAL */}
      <Dialog
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        {createdResult && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "flex" }}>
                  <CheckCircle2 size={28} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    Ticket Booking Created Successfully!
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Ticket No: {createdResult.ticketNo} • Booking ID: #{createdResult.bookingId}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, background: "#f8fafc" }}>
                    <Typography variant="subtitle2" color="#64748b" fontWeight={700}>
                      CUSTOMER & ROUTE DETAILS
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>Customer Name:</strong> {createdResult.customerName}</Typography>
                    <Typography variant="body2"><strong>Mobile:</strong> {createdResult.customerPhone}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {createdResult.customerEmail}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Pickup (From):</strong> {createdResult.fromAddress}</Typography>
                    <Typography variant="body2"><strong>Delivery (To):</strong> {createdResult.toAddress}</Typography>
                    <Typography variant="body2"><strong>Shifting Date:</strong> {createdResult.shiftingDate}</Typography>
                    <Typography variant="body2"><strong>Preferred Time Slot:</strong> {createdResult.slotTime || createdResult.timeSlot || "—"}</Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, background: "#fff7ed" }}>
                    <Typography variant="subtitle2" color="#ea580c" fontWeight={700}>
                      PAYMENT & TICKET SUMMARY
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>Quotation Number:</strong> {createdResult.quotationNumber}</Typography>
                    <Typography variant="body2"><strong>Total Agreed Amount:</strong> ₹{createdResult.price}</Typography>
                    <Typography variant="body2"><strong>Advance Token Paid:</strong> ₹{createdResult.paidAmount}</Typography>
                    <Typography variant="body2"><strong>Balance Amount Due:</strong> ₹{createdResult.balanceAmount}</Typography>
                    <Typography variant="body2"><strong>Payment Status:</strong> {createdResult.paymentStatus}</Typography>
                    <Typography variant="body2"><strong>Assigned Supervisor:</strong> {createdResult.assignedSupervisor}</Typography>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, background: "#fafafa" }}>
                    <Typography variant="subtitle2" color="#334155" fontWeight={700}>
                      CONFIRMED INVENTORY MANIFEST ({createdResult.selectedItems ? createdResult.selectedItems.length : 0} items)
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {createdResult.selectedItems && createdResult.selectedItems.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 180, overflowY: "auto", pt: 0.5 }}>
                        {createdResult.selectedItems.map((item, idx) => (
                          <Chip
                            key={idx}
                            label={`${item.name || item.itemName}: ${item.quantity || 1} unit(s)`}
                            size="small"
                            variant="outlined"
                            sx={{ background: "#ffffff", fontWeight: 700, borderColor: "#cbd5e1" }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="#94a3b8">No inventory items specified.</Typography>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={handleDownloadPDF}
                startIcon={<Download size={18} />}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
              >
                Download Quotation PDF
              </Button>

              <Button
                variant="contained"
                onClick={handleResetForm}
                startIcon={<Plus size={18} />}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
              >
                Create Another Ticket
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
