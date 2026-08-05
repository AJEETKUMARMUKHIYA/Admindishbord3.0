import { useState, useEffect } from "react";
import { getQuotationByNumber } from "../../services/dashboardService";
import { mapQuotationToViewModel } from "../../utils/quotationMapper";
import QuotationPreview from "../Reports/QuotationPreview.jsx";
import { generateBookingConfirmationPDF } from "../../utils/generateBookingConfirmationPDF";
import axiosClient from "../../AxiosClient";
import config from "../../config";
import {
  RefreshCw,
  Search,
  FileDown,
  FileSearch,
  Pencil,
  Inbox,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  X,
  Ban,
} from "lucide-react";

export default function Quotation() {
  const [number, setNumber] = useState("");
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [updateAdvanceAmount, setUpdateAdvanceAmount] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

  // Cancel Ticket Modal State
  const [cancelModalTicket, setCancelModalTicket] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const recordsPerPage = 10;

  const handleUpdateTicket = async () => {
    if (!selectedBookingId) {
      setUpdateMessage("Please select a booking from the table first.");
      return;
    }

    if (!updateAmount && !updateStatus && !updateAdvanceAmount) {
      setUpdateMessage("Provide total amount, partial amount, or status to update.");
      return;
    }

    try {
      const parsedTotal = updateAmount ? parseFloat(updateAmount) : null;
      let parsedAdvance = updateAdvanceAmount ? parseFloat(updateAdvanceAmount) : null;

      if (updateStatus === "Paid" && parsedAdvance === null && parsedTotal !== null) {
        parsedAdvance = parsedTotal;
      }

      const payload = {
        bookingID: selectedBookingId,
        totalAmount: parsedTotal,
        advanceAmount: parsedAdvance,
        advance: parsedAdvance,
        partialAmount: parsedAdvance,
        paidAmount: parsedAdvance,
        bookingStatus: updateStatus || null,
      };

      const response = await axiosClient.post(
        config.urls.dashboardUpdateBookings,
        payload
      );

      if (response.data?.success || response.status === 200) {
        setUpdateMessage("Booking Ticket updated successfully!");
        
        // Update local tickets state for immediate feedback
        setTickets((prev) =>
          prev.map((item) =>
            item.bookingID === selectedBookingId
              ? {
                  ...item,
                  totalAmount: parsedTotal !== null ? parsedTotal : item.totalAmount,
                  advanceAmount: parsedAdvance !== null ? parsedAdvance : item.advanceAmount,
                  advance: parsedAdvance !== null ? parsedAdvance : item.advance,
                  partialAmount: parsedAdvance !== null ? parsedAdvance : item.partialAmount,
                  paidAmount: parsedAdvance !== null ? parsedAdvance : item.paidAmount,
                  bookingStatus: updateStatus || item.bookingStatus,
                  status: updateStatus || item.status,
                }
              : item
          )
        );

        fetchData();
        
        // If currently previewing the updated quotation, refresh the preview as well
        if (quotation && quotation.quotationNumber === selectedBookingId) {
          handleSearch();
        }
      } else {
        setUpdateMessage(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      setUpdateMessage("Something went wrong during update.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalTicket) return;
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancelling this ticket.");
      return;
    }

    setCancelLoading(true);
    setCancelError("");

    try {
      const payload = {
        bookingID: cancelModalTicket.bookingID,
        bookingStatus: "Cancelled",
        cancelReason: cancelReason.trim(),
        cancelRegion: cancelReason.trim(),
        advanceAmount: 0,
        advance: 0,
      };

      const response = await axiosClient.post(
        config.urls.dashboardUpdateBookings,
        payload
      );

      if (response.data?.success || response.status === 200) {
        setUpdateMessage(`Ticket #${cancelModalTicket.bookingID} has been cancelled and advance amount set to ₹0.`);
        
        // Update local tickets list immediately
        setTickets((prev) =>
          prev.map((t) =>
            t.bookingID === cancelModalTicket.bookingID
              ? {
                  ...t,
                  bookingStatus: "Cancelled",
                  status: "Cancelled",
                  advanceAmount: 0,
                  advance: 0,
                  cancelReason: cancelReason.trim(),
                }
              : t
          )
        );

        setCancelModalTicket(null);
        setCancelReason("");
        fetchData();
      } else {
        setCancelError(response.data?.message || "Failed to cancel ticket.");
      }
    } catch (err) {
      console.error("Cancel ticket error:", err);
      setCancelError("An error occurred while cancelling the ticket.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!number) {
      setError("Please enter quotation number");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getQuotationByNumber(number);

      if (!response.success) {
        setError(response.message);
        setQuotation(null);
        return;
      }

      const mapped = mapQuotationToViewModel(response.data);
      setQuotation(mapped);
    } catch (err) {
      setError("Something went wrong during search.");
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!quotation) return;
    await generateBookingConfirmationPDF(quotation);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('booking-update', fetchData);
    return () => {
      window.removeEventListener('booking-update', fetchData);
    };
  }, []);

  const fetchTickets = async () => {
    let apiData = [];
    try {
      const response = await axiosClient.get(
        config.urls.dashboardRecentBookings
      );

      if (response.data?.data) apiData = response.data.data;
      else if (Array.isArray(response.data)) apiData = response.data;
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }

    let localData = [];
    try {
      const saved = localStorage.getItem('packyatra_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) localData = parsed;
      }
    } catch (e) {
      console.warn("Error loading local tickets in Quotation:", e);
    }

    const combined = [...localData, ...apiData];
    const uniqueMap = new Map();
    combined.forEach(t => {
      const key = String(t.quotationNumber || t.bookingID || t.bookingId || t.ticketNo || t.id);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      }
    });

    return Array.from(uniqueMap.values());
  };

  const fetchData = async () => {
    const ticketsData = await fetchTickets();
    setTickets(ticketsData);
  };

  const filteredTickets = tickets.filter((item) =>
    item.quotationNumber
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredTickets.slice(
    indexOfFirst,
    indexOfLast
  );

  const totalPages = Math.ceil(
    filteredTickets.length / recordsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return <span className="qp-status-badge status-paid">Paid</span>;
    } else if (s === "pending") {
      return <span className="qp-status-badge status-pending">Pending</span>;
    } else if (s === "partial") {  
      return <span className="qp-status-badge status-partial">Partial</span>;
    } else if (s === "cancelled" || s === "cancel") {
      return <span className="qp-status-badge status-cancelled">Cancelled</span>;
    }
    return <span className="qp-status-badge">{status || "Pending"}</span>;
  };

  return (
    <div id="quotationPage" className="quotation-module">
      <style>{`
        #quotationPage {
          --ink: #0f172a;
          --paper: #f8fafc;
          --line: #e2e8f0;
          --accent: #2563eb;
          --accent-soft: #eff6ff;
          --amber: #d97706;
          --amber-soft: #fffbeb;
          --success: #16a34a;
          --success-soft: #f0fdf4;
          --danger: #dc2626;
          --danger-soft: #fef2f2;
          --muted: #64748b;
        }

        #quotationPage .quotation-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (min-width: 1024px) {
          #quotationPage .quotation-grid {
            grid-template-columns: repeat(12, minmax(0, 1fr));
          }
          #quotationPage .col-left {
            grid-column: span 7;
          }
          #quotationPage .col-right {
            grid-column: span 5;
          }
        }

        #quotationPage .qp-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02);
          overflow: hidden;
        }

        #quotationPage .qp-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fafafa;
        }

        #quotationPage .qp-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        #quotationPage .qp-card-body {
          padding: 20px;
        }

        /* Pristine buttons */
        #quotationPage .qp-btn {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          padding: 9px 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        #quotationPage .qp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        #quotationPage .qp-btn-ghost {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
        }

        #quotationPage .qp-btn-ghost:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }

        #quotationPage .qp-btn-accent {
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          color: #ffffff;
          border: none;
        }

        #quotationPage .qp-btn-accent:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        #quotationPage .qp-btn-success {
          background: var(--success);
          color: #ffffff;
        }

        #quotationPage .qp-btn-success:hover:not(:disabled) {
          background: #15803d;
        }

        /* Sleek form fields */
        #quotationPage .qp-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        #quotationPage .qp-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        #quotationPage .qp-input, #quotationPage .qp-select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 9px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: var(--ink);
          background: #ffffff;
          transition: all 0.15s ease;
        }

        #quotationPage .qp-input:focus, #quotationPage .qp-select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        /* Status badges */
        #quotationPage .qp-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: capitalize;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
          color: #475569;
        }

        #quotationPage .status-paid {
          background: var(--success-soft);
          color: var(--success);
          border-color: #bbf7d0;
        }

        #quotationPage .status-pending {
          background: var(--amber-soft);
          color: var(--amber);
          border-color: #fde68a;
        }

        #quotationPage .status-partial {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: #bfdbfe;
        }

        #quotationPage .status-cancelled {
          background: var(--danger-soft);
          color: var(--danger);
          border-color: #fca5a5;
        }

        /* Custom Table */
        #quotationPage .qp-table-wrapper {
          overflow-x: auto;
          border-top: 1px solid var(--line);
        }

        #quotationPage .qp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        #quotationPage .qp-th {
          padding: 12px 18px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--muted);
          background: #fafafa;
          border-bottom: 1px solid var(--line);
          text-align: left;
        }

        #quotationPage .qp-td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          color: var(--ink);
          vertical-align: middle;
        }

        #quotationPage .qp-row {
          transition: background-color 0.15s ease;
        }

        #quotationPage .qp-row:hover {
          background-color: #f8fafc;
        }

        #quotationPage .qp-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        #quotationPage .qp-icon-btn-edit {
          color: var(--accent);
          border-color: #bfdbfe;
          background: var(--accent-soft);
        }

        #quotationPage .qp-icon-btn-edit:hover {
          border-color: var(--accent);
          background: #dbeafe;
          transform: translateY(-1px);
        }

        #quotationPage .qp-icon-btn-cancel {
          color: var(--danger);
          border-color: #fca5a5;
          background: var(--danger-soft);
        }

        #quotationPage .qp-icon-btn-cancel:hover {
          border-color: var(--danger);
          background: #fee2e2;
          transform: translateY(-1px);
        }

        #quotationPage .qp-page-btn {
          min-width: 30px;
          height: 30px;
          padding: 0 8px;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          transition: all 0.15s ease;
        }

        #quotationPage .qp-page-btn:hover {
          border-color: #94a3b8;
          background: #f8fafc;
        }

        #quotationPage .qp-page-btn.active {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }

        /* Payment Cell Styles */
        #quotationPage .payment-cell {
          display: inline-flex;
          align-items: center;
        }

        #quotationPage .amount-cell__paid {
          font-weight: 600;
          color: #047857;
          background: #ecfdf5;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 12.5px;
          border: 1px solid #a7f3d0;
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
        }

        /* Modal Dialog Styling */
        #quotationPage .qp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
        }

        #quotationPage .qp-modal-card {
          background: #ffffff;
          border-radius: 14px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #e2e8f0;
          animation: qpModalSlideIn 0.2s ease-out;
        }

        @keyframes qpModalSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Grid of controllers */}
      <div className="quotation-grid">
        {/* Left Card: Search & preview */}
        <div className="col-left qp-card">
          <div className="qp-card-header">
            <FileSearch size={16} className="text-blue-600" />
            <h3 className="qp-card-title">Search & Export Quotation</h3>
          </div>
          <div className="qp-card-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 200px" }} className="qp-input-wrapper">
                <label className="qp-label">Quotation number</label>
                <input
                  type="text"
                  className="qp-input"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.trimStart())}
                  placeholder="e.g. QTN-10234"
                />
              </div>

              <button
                type="button"
                className="qp-btn qp-btn-accent"
                onClick={handleSearch}
                disabled={loading || !number.trim()}
              >
                <Search size={14} /> {loading ? "Searching…" : "Search"}
              </button>

              <button
                type="button"
                className="qp-btn qp-btn-success"
                onClick={handleDownload}
                disabled={!quotation}
              >
                <FileDown size={14} /> Export PDF
              </button>
            </div>

            {error && (
              <div style={{
                marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 8, background: "var(--danger-soft)",
                color: "var(--danger)", fontSize: 13, fontWeight: 500,
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Quick Status & Amount Adjust */}
        <div className="col-right qp-card" id="quickAdjustSection">
          <div className="qp-card-header">
            <Pencil size={15} className="text-amber-600" />
            <h3 className="qp-card-title">Quick Status & Amount Adjust</h3>
          </div>
          <div className="qp-card-body">
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div className="qp-input-wrapper">
                  <label className="qp-label">Booking ID</label>
                  <input
                    type="text"
                    className="qp-input"
                    value={selectedBookingId || ""}
                    readOnly
                    placeholder="Select row below"
                    style={{ background: "#f8fafc", color: "var(--muted)", fontWeight: "500", cursor: "not-allowed" }}
                  />
                </div>

                <div className="qp-input-wrapper">
                  <label className="qp-label">Total Amount (₹)</label>
                  <input
                    type="number"
                    className="qp-input"
                    value={updateAmount}
                    onChange={(e) => {
                      setUpdateAmount(e.target.value);
                      if (updateStatus === "Paid") {
                        setUpdateAdvanceAmount(e.target.value);
                      }
                    }}
                    placeholder="e.g. 15000"
                  />
                </div>

                <div className="qp-input-wrapper">
                  <label className="qp-label">Advance / Partial (₹)</label>
                  <input
                    type="number"
                    className="qp-input"
                    value={updateAdvanceAmount}
                    onChange={(e) => setUpdateAdvanceAmount(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div className="qp-input-wrapper" style={{ flex: 1 }}>
                  <label className="qp-label">Status</label>
                  <select
                    className="qp-select"
                    value={updateStatus}
                    onChange={(e) => {
                      const newStat = e.target.value;
                      setUpdateStatus(newStat);
                      if (newStat === "Paid" && updateAmount) {
                        setUpdateAdvanceAmount(updateAmount);
                      }
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <button className="qp-btn qp-btn-accent" style={{ height: "38px" }} onClick={handleUpdateTicket}>
                  <CheckCircle2 size={14} /> Update
                </button>
              </div>
            </div>

            {updateMessage && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 8,
                background: updateMessage.includes("successfully") ? "var(--success-soft)" : "var(--accent-soft)",
                color: updateMessage.includes("successfully") ? "var(--success)" : "var(--accent)",
                fontSize: 13, fontWeight: 500,
              }}>
                {updateMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {quotation && (
        <div className="qp-card" style={{ marginBottom: 24 }}>
          <QuotationPreview data={quotation} />
        </div>
      )}

      {/* Main Table Card */}
      <div className="qp-card">
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                All Quotations Ledger
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--muted)" }}>
                Overview of booked moving records. Select any row to quickly edit.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11.5, color: "var(--muted)", fontWeight: "600" }}>
                {filteredTickets.length === 0
                  ? `0 of ${tickets.length}`
                  : `${indexOfFirst + 1}–${Math.min(indexOfLast, filteredTickets.length)} of ${filteredTickets.length}`}
              </span>
              <button className="qp-btn qp-btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={fetchData}>
                <RefreshCw size={13} /> Sync Ledger
              </button>
            </div>
          </div>
          
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              type="text"
              className="qp-input"
              style={{ paddingLeft: 34, height: "36px", fontSize: "13px" }}
              placeholder="Search by quotation number…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {currentRecords.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--muted)" }}>
            <Inbox size={28} style={{ marginBottom: 10, opacity: 0.5, margin: "0 auto 10px auto" }} />
            <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>No quotations found</div>
            <div style={{ fontSize: 13 }}>Try searching for a different quotation code.</div>
          </div>
        ) : (
          <div className="qp-table-wrapper">
            <table className="qp-table">
              <thead>
                <tr>
                  <th className="qp-th">Quotation Number</th>
                  <th className="qp-th">GC Number</th>
                  <th className="qp-th">Booking ID</th>
                  <th className="qp-th">Amount</th>
                  <th className="qp-th">Advance</th>
                  <th className="qp-th">Date</th>
                  <th className="qp-th">Status</th>
                  <th className="qp-th" style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((item, index) => {
                  const statusStr = (item.bookingStatus || item.status || "").toLowerCase();
                  const isCancelled = statusStr === "cancelled" || statusStr === "cancel";
                  
                  // Helper to get advance/partial paid amount
                  const explicitAdvance = item.bookingAmountPaid ?? item.advanceAmount ?? item.partialAmount ?? item.advance ?? item.paidAmount;
                  let advanceVal = 0;
                  if (isCancelled) {
                    advanceVal = 0;
                  } else if (explicitAdvance !== undefined && explicitAdvance !== null && explicitAdvance !== "") {
                    advanceVal = Number(explicitAdvance);
                  } else if (statusStr === "paid") {
                    advanceVal = Number(item.totalAmount || 0);
                  }

                  const paidAmountToDisplay = item.bookingAmountPaid ?? advanceVal;

                  return (
                    <tr key={index} className="qp-row">
                      <td className="qp-td" style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: "var(--accent)" }}>
                        {item.quotationNumber}
                      </td>
                      <td className="qp-td" style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 500 }}>
                        {item.invoiceNumber || "-"}
                      </td>
                      <td className="qp-td" style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 500 }}>
                        {item.bookingID}
                      </td>
                      <td className="qp-td" style={{ fontWeight: 600 }}>
                        ₹ {item.totalAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="qp-td">
                        <div className="payment-cell">
                          <span className="amount-cell__paid">
                            Paid: ₹{paidAmountToDisplay?.toLocaleString('en-IN') || "0"}
                          </span>
                        </div>
                      </td>
                      <td className="qp-td" style={{ color: "var(--muted)" }}>
                        {item.pickupDate ? new Date(item.pickupDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                      </td>
                      <td className="qp-td">
                        {renderStatusBadge(item.bookingStatus || item.status)}
                      </td>
                      <td className="qp-td" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                          {/* Event 1: Quick Status & Amount Adjust */}
                          <button
                            className="qp-icon-btn qp-icon-btn-edit"
                            title="Quick Status & Amount Adjust"
                            onClick={() => {
                              setSelectedBookingId(item.bookingID);
                              setUpdateAmount(item.totalAmount || "");
                              setUpdateAdvanceAmount(advanceVal !== undefined && advanceVal !== null ? advanceVal : "");
                              setUpdateStatus(statusStr === "paid" ? "Paid" : "Partial");
                              setUpdateMessage("");
                              const el = document.getElementById("quickAdjustSection");
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                              else window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Event 2: Cancel Ticket */}
                          <button
                            className="qp-icon-btn qp-icon-btn-cancel"
                            title="Cancel Ticket"
                            onClick={() => {
                              setCancelModalTicket(item);
                              setCancelReason("");
                              setCancelError("");
                            }}
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", borderTop: "1px solid var(--line)", flexWrap: "wrap", gap: 12,
          }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              Page <strong style={{ color: "var(--ink)" }}>{currentPage}</strong> of {totalPages}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className="qp-page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                title="Previous page"
              >
                <ChevronLeft size={13} />
              </button>

              {[...Array(totalPages)]
                .map((_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push(`ellipsis-${p}`);
                  acc.push(p);
                  return acc;
                }, [])
                .map((p) =>
                  typeof p === "string" ? (
                    <span key={p} style={{ padding: "0 4px", color: "var(--muted)", fontSize: 12 }}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`qp-page-btn ${currentPage === p ? "active" : ""}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                className="qp-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                title="Next page"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Ticket Dialog Popup */}
      {cancelModalTicket && (
        <div className="qp-modal-overlay" onClick={() => setCancelModalTicket(null)}>
          <div className="qp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: "18px 20px", borderBottom: "1px solid var(--line)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--danger-soft)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "#fee2e2",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)"
                }}>
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#991b1b" }}>
                    Cancel Ticket #{cancelModalTicket.bookingID}
                  </h3>
                  <span style={{ fontSize: 12, color: "#b91c1c" }}>
                    Quotation: {cancelModalTicket.quotationNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalTicket(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "12px 14px", marginBottom: 16, fontSize: 13
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Amount</span>
                    <div style={{ fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
                      ₹ {cancelModalTicket.totalAmount?.toLocaleString() || "0"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>New Advance Amount</span>
                    <div style={{ fontWeight: 700, color: "var(--danger)", marginTop: 2 }}>
                      ₹ 0 (Set to zero)
                    </div>
                  </div>
                </div>
              </div>

              <div className="qp-input-wrapper" style={{ marginBottom: 16 }}>
                <label className="qp-label">
                  Cancellation Reason / Region <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="qp-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                  placeholder="Enter reason for cancelling this ticket..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              {cancelError && (
                <div style={{
                  padding: "8px 12px", borderRadius: 8, background: "var(--danger-soft)",
                  color: "var(--danger)", fontSize: 12.5, fontWeight: 500, marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <AlertCircle size={14} /> {cancelError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="qp-btn qp-btn-ghost"
                  onClick={() => setCancelModalTicket(null)}
                  disabled={cancelLoading}
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  className="qp-btn"
                  style={{ background: "var(--danger)", color: "#ffffff" }}
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Confirm & Cancel Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
