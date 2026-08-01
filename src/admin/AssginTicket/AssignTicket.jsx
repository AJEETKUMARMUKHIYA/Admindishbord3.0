import React, { useState, useEffect, useMemo } from "react";
import axiosClient from "../../AxiosClient";
import config from "../../config";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Autocomplete,
  TextField,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Skeleton,
  useMediaQuery,
  Card,
  CardContent,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Truck, 
  MapPin, 
  ClipboardCheck,
  RefreshCw
} from "lucide-react";

// Status -> chip color mapping
const STATUS_STYLES = {
  open: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "Open" },
  pending: { bg: "#fef3c7", text: "#d97706", border: "#fde68a", label: "Pending" },
  "in progress": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "In Progress" },
  completed: { bg: "#ecfdf5", text: "#10b981", border: "#a7f3d0", label: "Completed" },
  closed: { bg: "#ecfdf5", text: "#10b981", border: "#a7f3d0", label: "Closed" },
  cancelled: { bg: "#fef2f2", text: "#ef4444", border: "#fecaca", label: "Cancelled" },
};

const getStatusBadge = (status) => {
  const key = (status || "").toLowerCase();
  const style = STATUS_STYLES[key] || { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", label: status || "Unknown" };
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "12px",
      fontSize: "11.5px",
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.text,
      border: `1px solid ${style.border}`,
      fontFamily: "'IBM Plex Mono', monospace"
    }}>
      {style.label}
    </span>
  );
};

// Map backend dashboardRecentBookings item into standard ticket object
const mapBookingToTicket = (item, index) => {
  const rawStatus = (item.bookingStatus || item.status || item.ticketStatus || 'Open').toString().trim();
  const lower = rawStatus.toLowerCase();

  let status = 'Open';
  if (['in progress', 'inprogress', 'confirmed', 'in transit', 'assigned'].some(s => lower.includes(s))) {
    status = 'In Progress';
  } else if (['cancelled', 'canceled', 'rejected'].some(s => lower.includes(s))) {
    status = 'Cancelled';
  } else if (['closed', 'completed', 'resolved', 'done'].some(s => lower.includes(s))) {
    status = 'Closed';
  } else {
    status = 'Open';
  }

  const bId = item.bookingID || item.id || (index + 1);
  const tNo = item.ticketNo || item.ticketRef || `TCK-${bId}`;

  const paidAmount = Number(
    item.bookingAmountPaid ??
    item.BookingAmountPaid ??
    item.paidAmount ??
    item.PaidAmount ??
    item.advanceAmount ??
    item.AdvanceAmount ??
    item.partialAmount ??
    item.PartialAmount ??
    0
  );

  const totalAmount = Number(
    item.totalAmount ??
    item.TotalAmount ??
    item.amount ??
    0
  );

  return {
    ...item,
    ticketID: item.ticketID || bId,
    ticketNo: tNo,
    bookingID: bId,
    quotationNumber: item.quotationNumber || `QUO-${bId}`,
    fromLocation: item.fromLocation || item.pickupLocation || item.from || 'Not Specified',
    toLocation: item.toLocation || item.dropLocation || item.to || 'Not Specified',
    status: status,
    rawStatus: rawStatus,
    userName: item.userName || item.customerName || 'Customer',
    userEmail: item.userEmail || '',
    userPhone: item.userPhone || '',
    totalAmount: totalAmount,
    bookingAmountPaid: paidAmount,
    assignedSupervisorID: item.assignedSupervisorID || item.supervisorId || null,
    vehicleId: item.vehicleId || item.truckId || null,
    reason: item.reason || item.cancellationReason || ''
  };
};

const AssignTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignedSupervisors, setAssignedSupervisors] = useState({}); // Track ticket-to-supervisor assignments
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Screen width media query for mobile cards view
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending_supervisor' | 'pending_fleet' | 'assigned' | 'completed'

  // Fetch tickets from dashboardRecentBookings endpoint and supervisors/vehicles
  const fetchData = async () => {
    setLoading(true);
    try {
      const [recentBookingsRes, supervisorsResponse, vehiclesResponse] = await Promise.allSettled([
        axiosClient.get(config.urls?.dashboardRecentBookings || "/Dashboard/recent-bookings"),
        axiosClient.get(config.urls?.supervisors || "/Booking/Supervisors"),
        axiosClient.get(config.urls?.vehicles || "/Vehicle/all"),
      ]);

      let ticketsData = [];
      if (recentBookingsRes.status === 'fulfilled') {
        const raw = recentBookingsRes.value.data;
        const items = raw?.data || (Array.isArray(raw) ? raw : []);
        ticketsData = items.map(mapBookingToTicket);
      } else {
        // Fallback to /Booking/Tickets
        try {
          const fallbackRes = await axiosClient.get("/Booking/Tickets");
          const raw = fallbackRes.data;
          const items = raw?.data || (Array.isArray(raw) ? raw : []);
          ticketsData = items.map(mapBookingToTicket);
        } catch {
          ticketsData = [];
        }
      }

      setTickets(ticketsData);

      if (supervisorsResponse.status === 'fulfilled') {
        const raw = supervisorsResponse.value.data;
        setSupervisors(raw?.data || (Array.isArray(raw) ? raw : []));
      } else {
        setSupervisors([]);
      }

      if (vehiclesResponse.status === 'fulfilled') {
        const raw = vehiclesResponse.value.data;
        setVehicles(raw?.data || (Array.isArray(raw) ? raw : []));
      } else {
        setVehicles([]);
      }

      // Initialize assigned supervisors from fetched tickets
      const initialAssigned = {};
      ticketsData.forEach((ticket) => {
        if (ticket.assignedSupervisorID) {
          initialAssigned[ticket.ticketID] = ticket.assignedSupervisorID;
        }
      });
      setAssignedSupervisors(initialAssigned);
    } catch (error) {
      console.error("Fetch error:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: "Failed to fetch data: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Base active non-cancelled tickets with paid amount > 0
  const activePartialPaidTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const paid = Number(
        ticket.bookingAmountPaid ??
        ticket.BookingAmountPaid ??
        ticket.paidAmount ??
        ticket.PaidAmount ??
        ticket.advanceAmount ??
        ticket.AdvanceAmount ??
        ticket.partialAmount ??
        ticket.PartialAmount ??
        0
      );

      const statusLower = (ticket.status || ticket.rawStatus || ticket.bookingStatus || "").toString().toLowerCase();
      const isCancelled = statusLower.includes("cancel") || statusLower.includes("reject");

      return paid > 0 && !isCancelled;
    });
  }, [tickets]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = activePartialPaidTickets.length;
    const pendingSupervisor = activePartialPaidTickets.filter(t => !t.assignedSupervisorID).length;
    const pendingFleet = activePartialPaidTickets.filter(t => !t.vehicleId).length;
    const assigned = activePartialPaidTickets.filter(t => t.assignedSupervisorID && t.vehicleId).length;
    const completed = activePartialPaidTickets.filter(t => (t.status || "").toLowerCase() === "completed" || (t.status || "").toLowerCase() === "closed").length;

    return { all, pendingSupervisor, pendingFleet, assigned, completed };
  }, [activePartialPaidTickets]);

  // Search filter & tab filter
  const filteredTickets = useMemo(() => {
    let list = activePartialPaidTickets;

    if (activeTab === "pending_supervisor") {
      list = list.filter((t) => !t.assignedSupervisorID);
    } else if (activeTab === "pending_fleet") {
      list = list.filter((t) => !t.vehicleId);
    } else if (activeTab === "assigned") {
      list = list.filter((t) => t.assignedSupervisorID && t.vehicleId);
    } else if (activeTab === "completed") {
      list = list.filter((t) => (t.status || "").toLowerCase() === "completed" || (t.status || "").toLowerCase() === "closed");
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((ticket) =>
      String(ticket.bookingID ?? "").toLowerCase().includes(query) ||
      String(ticket.ticketNo ?? "").toLowerCase().includes(query) ||
      String(ticket.userName ?? "").toLowerCase().includes(query) ||
      String(ticket.quotationNumber ?? "").toLowerCase().includes(query) ||
      String(ticket.fromLocation ?? "").toLowerCase().includes(query) ||
      String(ticket.toLocation ?? "").toLowerCase().includes(query)
    );
  }, [activePartialPaidTickets, activeTab, searchQuery]);

  // Compute metrics dynamically for tactical overview
  const metrics = useMemo(() => {
    const total = activePartialPaidTickets.length;
    const pendingSupervisor = activePartialPaidTickets.filter(t => !t.assignedSupervisorID).length;
    const pendingVehicle = activePartialPaidTickets.filter(t => !t.vehicleId).length;
    const completed = activePartialPaidTickets.filter(t => (t.status || "").toLowerCase() === "completed" || (t.status || "").toLowerCase() === "closed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pendingSupervisor,
      pendingVehicle,
      completionRate
    };
  }, [activePartialPaidTickets]);

  // Handle supervisor assignment
  const handleAssignSupervisor = async (ticketId, supervisorId) => {
    try {
      const response = await axiosClient.put(
        `/Booking/AssignBookingTicket/${ticketId}`,
        { TicketID: ticketId, SupervisorID: supervisorId },
        { headers: { "Content-Type": "application/json" } }
      );

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.ticketID === ticketId
            ? { ...ticket, assignedSupervisorID: supervisorId }
            : ticket
        )
      );

      setAssignedSupervisors((prev) => ({
        ...prev,
        [ticketId]: supervisorId,
      }));

      setSnackbar({
        open: true,
        message: `Ticket #${ticketId} assigned successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Assign error:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: "Failed to assign ticket: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
      throw error;
    }
  };

  // Handle supervisor unassignment
  const handleUnassignSupervisor = async (ticketId) => {
    try {
      const response = await axiosClient.put(
        `/Booking/AssignBookingTicket/${ticketId}`,
        { TicketID: ticketId, SupervisorID: 0 },
        { headers: { "Content-Type": "application/json" } }
      );

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.ticketID === ticketId ? { ...ticket, assignedSupervisorID: null } : ticket
        )
      );

      setAssignedSupervisors((prev) => {
        const updated = { ...prev };
        delete updated[ticketId];
        return updated;
      });

      setSnackbar({
        open: true,
        message: `Ticket #${ticketId} unassigned successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Unassign error:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: "Failed to unassign ticket: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
      throw error;
    }
  };

  const handleAssignedVehicle = async (bookingID, vehicleID) => {
    try {
      await axiosClient.post("/Vehicle/assign", {
        bookingId: bookingID,
        vehicleId: vehicleID,
      });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.ticketID === bookingID ? { ...ticket, vehicleId: vehicleID } : ticket
        )
      );

      setSnackbar({
        open: true,
        message: "Vehicle assigned successfully",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Vehicle assignment failed",
        severity: "error",
      });
    }
  };

  const handleUnAssignVehicle = async (bookingID, vehicleID) => {
    try {
      await axiosClient.post("/Vehicle/unassign", {
        bookingId: bookingID,
        vehicleId: vehicleID,
      });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.ticketID === bookingID ? { ...ticket, vehicleId: null } : ticket
        )
      );

      setSnackbar({
        open: true,
        message: "Vehicle unassigned successfully",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Vehicle unassign failed",
        severity: "error",
      });
    }
  };

  // Helpers
  const getAvailableSupervisors = () => supervisors;
  const getAllVehicles = () => vehicles || [];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const paginatedTickets = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredTickets.slice(start, start + rowsPerPage);
  }, [filteredTickets, page, rowsPerPage]);
console.log("Filtered Tickets:", filteredTickets);
  if (loading) {
    return (
      <Box sx={{ width: "100%", py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={160} height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={280} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={380} height={20} />
        </Box>

        {/* Skeleton Metric Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} variant="rounded" height={88} sx={{ borderRadius: '12px' }} />
          ))}
        </Box>

        {/* Skeleton Control & Filter Bar */}
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: '12px 12px 0 0', mb: 1 }} />

        {/* Skeleton Rows */}
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <Skeleton key={row} variant="rectangular" height={52} sx={{ borderRadius: '6px' }} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <div id="assignTicketsWrapper">
      <style>{`
        #assignTicketsWrapper {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 10px 0 40px;
        }

        /* Eyebrow & Header */
        .page-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #2563eb;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .page-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 28px 0;
        }

        /* Tactical metrics cards */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 576px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e1;
        }

        .metric-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-data {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .metric-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }

        /* Table Control & Filter Section */
        .table-control-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-bottom: none;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .table-control-bar {
            flex-direction: column;
            align-items: stretch;
            padding: 16px;
          }
        }

        .search-container {
          position: relative;
          max-width: 380px;
          width: 100%;
        }

        .search-icon-left {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .search-input-field {
          width: 100%;
          padding: 9px 36px 9px 38px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        .search-input-field:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          outline: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .search-clear-btn:hover {
          color: #ef4444;
        }

        /* Styled table container */
        .custom-paper-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        /* Quick Action Table Buttons */
        .btn-action-unassign {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border: 1.5px solid #fecaca;
          background-color: #fffafb;
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-action-unassign:hover:not(:disabled) {
          background-color: #fef2f2;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        .btn-action-unassign:disabled {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* Table header cells custom */
        .tbl-header-cell {
          background-color: #f8fafc !important;
          color: #475569 !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          padding: 14px 18px !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }

        .tbl-row-data {
          transition: background-color 0.15s ease;
        }

        .tbl-row-data:hover {
          background-color: #f8fafc !important;
        }

        .tbl-cell-data {
          font-size: 13.5px !important;
          padding: 14px 18px !important;
          color: #0f172a !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }

        .location-text {
          font-size: 12.5px;
          color: #475569;
          font-weight: 500;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .refresh-data-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .refresh-data-btn:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }

        /* Quick Filter Tabs Bar */
        .quick-tabs-container {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          scrollbar-width: thin;
        }

        .quick-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          color: #64748b;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .quick-tab-btn:hover {
          color: #2563eb;
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .quick-tab-btn.active {
          color: #ffffff;
          background: #2563eb;
          border-color: #2563eb;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
        }

        .tab-badge {
          display: inline-block;
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          background: #e2e8f0;
          color: #334155;
        }

        .quick-tab-btn.active .tab-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .tab-badge.warning {
          background: #fef3c7;
          color: #d97706;
        }

        .tab-badge.info {
          background: #e0f2fe;
          color: #0284c7;
        }

        .tab-badge.success {
          background: #d1fae5;
          color: #059669;
        }

        /* Mobile Card Container */
        .mobile-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
        }

        .mobile-ticket-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
      `}</style>

      {/* Header and Eyebrow */}
      <div className="page-header">
        <div className="page-eyebrow">
          <ShieldAlert size={12} /> Workforce & Fleet Logistics Coordinator
        </div>
        <h1 className="page-title">Assign Tickets</h1>
        <p className="page-subtitle">Assign field operations supervisors and commercial transport vehicles to confirmed customer booking tickets.</p>
      </div>

      {/* Real-time Diagnostics metrics bar */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <ClipboardCheck size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Active Tickets</span>
            <span className="metric-value">{metrics.total}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            <Users size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Pending Supervisor</span>
            <span className="metric-value">{metrics.pendingSupervisor}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
            <Truck size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Pending Fleet</span>
            <span className="metric-value">{metrics.pendingVehicle}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: "#fdf2f8", color: "#db2777" }}>
            <TrendingUp size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Completion Rate</span>
            <span className="metric-value">{metrics.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Table Grid and Controls */}
      <div className="custom-paper-container">
        
        {/* Quick Filter Tabs Bar */}
        <div className="quick-tabs-container">
          <button 
            className={`quick-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); setPage(0); }}
          >
            All <span className="tab-badge">{tabCounts.all}</span>
          </button>

          <button 
            className={`quick-tab-btn ${activeTab === 'pending_supervisor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending_supervisor'); setPage(0); }}
          >
            Pending Supervisor <span className="tab-badge warning">{tabCounts.pendingSupervisor}</span>
          </button>

          <button 
            className={`quick-tab-btn ${activeTab === 'pending_fleet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending_fleet'); setPage(0); }}
          >
            Pending Fleet <span className="tab-badge info">{tabCounts.pendingFleet}</span>
          </button>

          <button 
            className={`quick-tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => { setActiveTab('assigned'); setPage(0); }}
          >
            Fully Assigned <span className="tab-badge success">{tabCounts.assigned}</span>
          </button>

          <button 
            className={`quick-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => { setActiveTab('completed'); setPage(0); }}
          >
            Completed <span className="tab-badge success">{tabCounts.completed}</span>
          </button>
        </div>

        {/* Table Control Bar */}
        <div className="table-control-bar">
          <div className="search-container">
            <SearchIcon className="search-icon-left" style={{ fontSize: 18 }} />
            <input 
              type="text" 
              className="search-input-field"
              placeholder="Search by Booking ID..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => handleSearchChange({ target: { value: "" } })}>
                <CloseIcon style={{ fontSize: 16 }} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="refresh-data-btn" onClick={fetchData}>
              <RefreshCw size={14} />
              Re-sync
            </button>
            <Chip
              label={`${filteredTickets.length} ticket${filteredTickets.length === 1 ? "" : "s"} filtered`}
              sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}
            />
          </div>
        </div>

        {/* Conditional Rendering: Mobile Cards vs Desktop MUI Table */}
        {isMobile ? (
          <div className="mobile-cards-list">
            {paginatedTickets.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {searchQuery
                    ? `No dispatch records found matching "${searchQuery}".`
                    : "No partially paid bookings loaded."}
                </Typography>
              </Box>
            ) : (
              paginatedTickets.map((ticket) => (
                <div key={ticket.ticketID} className="mobile-ticket-card">
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Space Grotesk', sans-serif" }}>
                        #{ticket.bookingID}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 8 }}>
                        {ticket.quotationNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getStatusBadge(ticket.bookingStatus)}
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0'
                      }}>
                        ₹{Number(ticket.bookingAmountPaid || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Customer and Locations */}
                  <div style={{ fontSize: '13px', color: '#334155', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                      {ticket.userName || "Customer"}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '12px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} style={{ color: '#0284c7' }} />
                        <span><strong>From:</strong> {ticket.fromLocation || "Not Configured"}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} style={{ color: '#10b981' }} />
                        <span><strong>To:</strong> {ticket.toLocation || "Not Configured"}</span>
                      </div>
                    </div>
                  </div>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Actions */}
                  <Stack spacing={1.5}>
                    {/* Vehicle Assignment */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocalShippingOutlinedIcon fontSize="small" sx={{ color: "#0284c7" }} />
                      <Autocomplete
                        fullWidth
                        options={getAllVehicles()}
                        getOptionLabel={(option) => option.vehicleNumber || ""}
                        value={vehicles.find((v) => v.id === ticket.vehicleId) || null}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            handleAssignedVehicle(ticket.ticketID, newValue.id);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            placeholder="Assign vehicle..." 
                            size="small" 
                            variant="outlined" 
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                backgroundColor: '#ffffff'
                              }
                            }}
                          />
                        )}
                        slotProps={{ paper: { elevation: 3, sx: { borderRadius: '8px', fontSize: '13px' } } }}
                      />
                      {ticket.vehicleId && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUnAssignVehicle(ticket.ticketID, ticket.vehicleId)}
                          sx={{ border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Supervisor Assignment */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonOutlineOutlinedIcon fontSize="small" sx={{ color: "#059669" }} />
                      <Autocomplete
                        fullWidth
                        options={getAvailableSupervisors()}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={supervisors.find((s) => s.userId === ticket.assignedSupervisorID) || null}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            handleAssignSupervisor(ticket.ticketID, newValue.userId);
                          } else {
                            handleUnassignSupervisor(ticket.ticketID);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            placeholder="Assign supervisor..." 
                            size="small" 
                            variant="outlined" 
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                backgroundColor: '#ffffff'
                              }
                            }}
                          />
                        )}
                        slotProps={{ paper: { elevation: 3, sx: { borderRadius: '8px', fontSize: '13px' } } }}
                      />
                      {ticket.assignedSupervisorID && (
                        <button
                          className="btn-action-unassign"
                          onClick={() => handleUnassignSupervisor(ticket.ticketID)}
                        >
                          Revoke
                        </button>
                      )}
                    </Stack>
                  </Stack>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop MUI Table */
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small" aria-label="assign tickets table">
              <TableHead>
                <TableRow>
                  <TableCell className="tbl-header-cell">Booking ID</TableCell>
                  <TableCell className="tbl-header-cell">Quotation Number</TableCell>
                  <TableCell className="tbl-header-cell">Status</TableCell>
                  <TableCell className="tbl-header-cell">Amount Paid</TableCell>
                  <TableCell className="tbl-header-cell">Truck/Fleet Assignment</TableCell>
                  <TableCell className="tbl-header-cell">Field Supervisor</TableCell>
                  <TableCell className="tbl-header-cell">Action</TableCell>
                  <TableCell className="tbl-header-cell">Origin (From)</TableCell>
                  <TableCell className="tbl-header-cell">Destination (To)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 8 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {searchQuery
                          ? `No dispatch records found matching "${searchQuery}".`
                          : "No partially paid bookings (BookingAmountPaid > 0) loaded in operational database."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <TableRow
                      key={ticket.ticketID}
                      className="tbl-row-data"
                    >
                      {/* Booking ID */}
                      <TableCell className="tbl-cell-data" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                        #{ticket.bookingID}
                      </TableCell>
                      <TableCell className="tbl-cell-data">
                        {ticket.quotationNumber}
                      </TableCell>
                      {/* Status Badge */}
                      <TableCell className="tbl-cell-data">
                        {getStatusBadge(ticket.bookingStatus)}
                      </TableCell>

                      {/* Booking Amount Paid */}
                      <TableCell className="tbl-cell-data">
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}>
                          ₹{Number(ticket.bookingAmountPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </TableCell>

                      {/* Vehicle Assignment */}
                      <TableCell className="tbl-cell-data">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocalShippingOutlinedIcon fontSize="small" sx={{ color: "#64748b" }} />
                          <Autocomplete
                            options={getAllVehicles()}
                            getOptionLabel={(option) => option.vehicleNumber || ""}
                            value={vehicles.find((v) => v.id === ticket.vehicleId) || null}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleAssignedVehicle(ticket.ticketID, newValue.id);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder="Assign vehicle..." 
                                size="small" 
                                variant="outlined" 
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    backgroundColor: '#ffffff',
                                    '& fieldset': { borderColor: '#cbd5e1' },
                                    '&:hover fieldset': { borderColor: '#94a3b8' },
                                    '&.Mui-focused fieldset': { borderColor: '#2563eb' }
                                  }
                                }}
                              />
                            )}
                            sx={{ minWidth: 180 }}
                            slotProps={{ paper: { elevation: 3, sx: { borderRadius: '8px', fontSize: '13px' } } }}
                          />
                          <Tooltip title={ticket.vehicleId ? "Revoke vehicle assignment" : "No vehicle assigned"}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!ticket.vehicleId}
                                onClick={() => handleUnAssignVehicle(ticket.ticketID, ticket.vehicleId)}
                                sx={{ 
                                  border: '1px solid', 
                                  borderColor: ticket.vehicleId ? '#fee2e2' : '#e2e8f0',
                                  backgroundColor: ticket.vehicleId ? '#fef2f2' : 'transparent',
                                  '&:hover': { backgroundColor: '#fee2e2' }
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      {/* Supervisor Assignment */}
                      <TableCell className="tbl-cell-data">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PersonOutlineOutlinedIcon fontSize="small" sx={{ color: "#64748b" }} />
                          <Autocomplete
                            options={getAvailableSupervisors()}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            value={supervisors.find((s) => s.userId === ticket.assignedSupervisorID) || null}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleAssignSupervisor(ticket.ticketID, newValue.userId);
                              } else {
                                handleUnassignSupervisor(ticket.ticketID);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder="Assign supervisor..." 
                                size="small" 
                                variant="outlined" 
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    backgroundColor: '#ffffff',
                                    '& fieldset': { borderColor: '#cbd5e1' },
                                    '&:hover fieldset': { borderColor: '#94a3b8' },
                                    '&.Mui-focused fieldset': { borderColor: '#2563eb' }
                                  }
                                }}
                              />
                            )}
                            sx={{ minWidth: 200 }}
                            slotProps={{ paper: { elevation: 3, sx: { borderRadius: '8px', fontSize: '13px' } } }}
                          />
                        </Stack>
                      </TableCell>

                      {/* Quick Revocation button */}
                      <TableCell className="tbl-cell-data">
                        <button
                          className="btn-action-unassign"
                          onClick={() => handleUnassignSupervisor(ticket.ticketID)}
                          disabled={!ticket.assignedSupervisorID}
                        >
                          Unassign
                        </button>
                      </TableCell>

                      {/* Origin location */}
                      <TableCell className="tbl-cell-data">
                        <Tooltip title={ticket.fromLocation || ""}>
                          <div className="location-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span>{ticket.fromLocation || "Not Configured"}</span>
                          </div>
                        </Tooltip>
                      </TableCell>

                      {/* Destination location */}
                      <TableCell className="tbl-cell-data">
                        <Tooltip title={ticket.toLocation || ""}>
                          <div className="location-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span>{ticket.toLocation || "Not Configured"}</span>
                          </div>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Elegant Pagination bar */}
        <TablePagination
          component="div"
          count={filteredTickets.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: "1px solid",
            borderColor: "#e2e8f0",
            backgroundColor: "#f8fafc",
            fontFamily: "inherit",
            fontSize: "12.5px",
            '& .MuiTablePagination-select': {
              fontWeight: 600,
              fontSize: '12.5px'
            }
          }}
        />
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AssignTicket;