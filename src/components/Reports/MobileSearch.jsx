import { useState, useEffect } from "react";
import axiosClient from "../../AxiosClient";
import config from "../../config";
import { generateBookingConfirmationPDF } from "../../utils/generateBookingConfirmationPDF";
import {
  Search,
  Phone,
  User,
  Mail,
  FileText,
  Calendar,
  RefreshCw,
  X,
  Copy,
  Check,
  Download,
  FileDown,
  AlertCircle,
  Inbox,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function MobileSearch() {
  const [mobileInput, setMobileInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchedTerm, setSearchedTerm] = useState("");

  // Helper to extract clean digit sequence for robust comparison
  const cleanPhone = (str) => {
    if (!str) return "";
    return String(str).replace(/[^0-9]/g, "");
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    const term = mobileInput.trim();
    if (!term) {
      setError("Please enter a mobile number to search.");
      toast.error("Please enter a mobile number.");
      return;
    }

    const digitsOnly = cleanPhone(term);
    if (digitsOnly.length < 3) {
      setError("Please enter at least 3 digits of the mobile number.");
      toast.error("Enter at least 3 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearchedTerm(term);
      setHasSearched(true);

      const combinedRecords = [];

      // 1. Fetch recent bookings from dashboard recent bookings
      try {
        const resBookings = await axiosClient.get(config.urls.dashboardRecentBookings);
        const dataArr = resBookings.data?.data || (Array.isArray(resBookings.data) ? resBookings.data : []);
        dataArr.forEach(b => combinedRecords.push(b));
      } catch (err) {
        console.warn("Notice fetching recent bookings for mobile search:", err.message);
      }

      // 2. Fetch from /Booking/Tickets
      try {
        const resTickets = await axiosClient.get(config.urls.tickets || "/Booking/Tickets");
        const ticketArr = resTickets.data?.data || (Array.isArray(resTickets.data) ? resTickets.data : []);
        ticketArr.forEach(t => combinedRecords.push(t));
      } catch (err) {
        console.warn("Notice fetching tickets for mobile search:", err.message);
      }

      // 3. Merge local storage tickets/bookings if available
      try {
        const localSaved = localStorage.getItem('packyatra_tickets');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => combinedRecords.push(item));
          }
        }
      } catch (err) {
        console.warn("Error reading local tickets", err);
      }

      // 4. Filter records matching the mobile number
      const matchedMap = new Map();

      combinedRecords.forEach((item, index) => {
        const phone1 = item.userPhone || item.mobile || item.phone || item.customerPhone || item.Mobile || "";
        const phoneClean = cleanPhone(phone1);

        // Match if clean digits match or raw phone string includes the term
        if (phoneClean.includes(digitsOnly) || String(phone1).toLowerCase().includes(term.toLowerCase())) {
          // Unique key by bookingID or ID or mobile+index
          const key = item.bookingID || item.ticketID || item.id || `rec-${index}-${phoneClean}`;
          
          if (!matchedMap.has(key)) {
            const rawDate = item.bookingDate || item.pickupDate || item.createdDate || item.CreatedDate || item.date;
            let formattedDate = 'N/A';
            if (rawDate) {
              try {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                } else {
                  formattedDate = String(rawDate);
                }
              } catch {
                formattedDate = String(rawDate);
              }
            } else if (item.formattedPickupDate) {
              formattedDate = item.formattedPickupDate;
            }

            const rawQuot = item.quotationNumber || item.quotationNo || item.QuotationNo || item.quotation;
            const qtnDisplay = rawQuot ? rawQuot : (item.bookingID ? `QTN-${item.bookingID}` : (item.id ? `QTN-${item.id}` : `QTN-${Math.floor(1000 + Math.random() * 9000)}`));

            matchedMap.set(key, {
              id: key,
              bookingID: item.bookingID || item.ticketID || item.id,
              userName: item.userName || item.customerName || item.name || item.fullName || (item.FirstName ? `${item.FirstName} ${item.LastName || ''}`.trim() : 'Customer'),
              userEmail: item.userEmail || item.email || item.Email || item.customerEmail || 'N/A',
              mobileNumber: phone1 || term,
              quotationNumber: qtnDisplay,
              bookingDate: formattedDate,
              rawDate: rawDate,
              fromLocation: item.fromLocation || item.pickupLocation || 'Bangalore',
              toLocation: item.toLocation || item.dropLocation || 'Domestic',
              status: item.bookingStatus || item.status || item.ticketStatus || 'Confirmed',
              totalAmount: item.totalAmount || item.total || item.estimatedCost || 18500,
              advanceAmount: item.advanceAmount || item.advance || 2500,
              items: item.items || item.inventoryList || [],
              rawItem: item,
            });
          }
        }
      });

      const finalMatches = Array.from(matchedMap.values());
      setSearchResults(finalMatches);

      if (finalMatches.length === 0) {
        toast.info(`No customer records found matching "${term}"`);
      } else {
        toast.success(`Found ${finalMatches.length} customer record(s)`);
      }

    } catch (err) {
      console.error("Error during mobile search:", err);
      setError("An error occurred while fetching search results. Please try again.");
      toast.error("Failed to execute mobile search");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQuotation = async (row) => {
    try {
      setDownloadingId(row.id);
      toast.info(`Generating Quotation PDF for ${row.quotationNumber}...`);

      const rawObj = row.rawItem || {};
      const extractedItems = row.items?.length > 0 
        ? row.items 
        : (rawObj.items || rawObj.selectedItems || rawObj.bookingItemList || rawObj.inventoryList || []);

      const quotationData = {
        ...rawObj,
        bookingID: row.bookingID || row.id || rawObj.bookingID || rawObj.id,
        quotationNumber: row.quotationNumber || rawObj.quotationNumber || rawObj.quotationNo,
        customerName: row.userName || rawObj.customerName || rawObj.userName || rawObj.name,
        userName: row.userName || rawObj.userName,
        userPhone: row.mobileNumber || rawObj.phone || rawObj.userPhone || rawObj.phoneNumber,
        phone: row.mobileNumber || rawObj.phone || rawObj.userPhone || rawObj.phoneNumber,
        userEmail: row.userEmail && row.userEmail !== 'N/A' ? row.userEmail : (rawObj.userEmail || rawObj.email || ''),
        email: row.userEmail && row.userEmail !== 'N/A' ? row.userEmail : (rawObj.email || rawObj.userEmail || ''),
        fromAddress: row.fromLocation || rawObj.fromAddress || rawObj.fromLocation || "Bengaluru, Karnataka",
        fromLocation: row.fromLocation || rawObj.fromLocation || rawObj.fromAddress || "Bengaluru, Karnataka",
        toAddress: row.toLocation || rawObj.toAddress || rawObj.toLocation || "Destination City",
        toLocation: row.toLocation || rawObj.toLocation || rawObj.toAddress || "Destination City",
        pickupDate: row.rawDate || row.bookingDate || rawObj.pickupDate || rawObj.bookingDate,
        bookingDate: row.bookingDate || rawObj.bookingDate,
        totalAmount: row.totalAmount || rawObj.totalAmount || rawObj.totalPrice || 18500,
        advanceAmount: row.advanceAmount || rawObj.advanceAmount || rawObj.bookingAmount || 2500,
        items: extractedItems,
        selectedItems: extractedItems,
        bookingItemList: extractedItems
      };

      await generateBookingConfirmationPDF(quotationData);
      toast.success(`Quotation PDF downloaded: ${row.quotationNumber}`);
    } catch (err) {
      console.error("Failed to generate Quotation PDF:", err);
      toast.error("Failed to download Quotation PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleClear = () => {
    setMobileInput("");
    setSearchResults([]);
    setHasSearched(false);
    setError("");
    setSearchedTerm("");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportToCSV = () => {
    if (searchResults.length === 0) return;
    const headers = ["User Name", "User Email", "Mobile Number", "Quotation Number", "Booking Date", "Pickup Location", "Drop Location", "Status"];
    const rows = searchResults.map(r => [
      `"${r.userName}"`,
      `"${r.userEmail}"`,
      `"${r.mobileNumber}"`,
      `"${r.quotationNumber}"`,
      `"${r.bookingDate}"`,
      `"${r.fromLocation}"`,
      `"${r.toLocation}"`,
      `"${r.status}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Search_Mobile_${searchedTerm || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully!");
  };

  return (
    <div className="mobile-search-module">
      <style>{`
        .mobile-search-module {
          animation: searchFadeIn 0.3s ease-out;
        }

        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-card-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          padding: 24px;
          margin-bottom: 24px;
        }

        .search-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .search-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .search-card-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0;
        }

        .search-form-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .input-group-custom {
          flex: 1;
          min-width: 280px;
          position: relative;
        }

        .input-group-custom label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .input-relative {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-relative .search-prefix-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .input-relative input {
          width: 100%;
          padding: 12px 40px 12px 42px;
          font-size: 15px;
          font-weight: 500;
          color: #0f172a;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-relative input:focus {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .clear-btn-inside {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-btn-inside:hover {
          color: #64748b;
          background: #e2e8f0;
        }

        .form-actions-buttons {
          display: flex;
          gap: 10px;
          align-self: flex-end;
          margin-top: 22px;
        }

        .btn-search-primary {
          padding: 12px 24px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
        }

        .btn-search-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-search-primary:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-reset-secondary {
          padding: 12px 18px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-reset-secondary:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Results Data Grid Styling */
        .results-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .results-header-bar {
          padding: 18px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .results-count-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .results-count-badge {
          background: #dbeafe;
          color: #1e40af;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .export-btn {
          padding: 8px 14px;
          background: #1e293b;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .export-btn:hover {
          background: #0f172a;
        }

        .grid-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .custom-data-grid {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          text-align: left;
        }

        .custom-data-grid th {
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 14px 18px;
          border-bottom: 1px solid #cbd5e1;
          white-space: nowrap;
        }

        .custom-data-grid td {
          padding: 16px 18px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .custom-data-grid tr:hover td {
          background: #f8fafc;
        }

        .user-avatar-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0284c7);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .user-name-text {
          font-weight: 600;
          color: #0f172a;
          font-size: 14.5px;
        }

        .user-email-text {
          color: #2563eb;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }

        .phone-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 13px;
        }

        .quotation-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .quotation-download-btn:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
          transform: translateY(-1px);
        }

        .quotation-download-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .btn-copy-sm {
          background: none;
          border: none;
          color: #1d4ed8;
          cursor: pointer;
          padding: 4px;
          display: inline-flex;
          align-items: center;
          border-radius: 4px;
        }

        .btn-copy-sm:hover {
          color: #1e40af;
          background: #dbeafe;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-weight: 500;
          font-size: 13.5px;
        }

        .status-pill-sub {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-pill-sub.confirmed, .status-pill-sub.completed {
          background: #dcfce7;
          color: #15803d;
        }

        .status-pill-sub.open, .status-pill-sub.in-progress {
          background: #e0f2fe;
          color: #0369a1;
        }

        .empty-state-card {
          text-align: center;
          padding: 48px 24px;
          color: #64748b;
        }

        .empty-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .empty-desc {
          font-size: 13.5px;
          color: #64748b;
          max-width: 420px;
          margin: 0 auto;
        }

        .error-banner {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13.5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Search Form Card */}
      <div className="search-card-container">
        <div className="search-card-header">
          <div className="search-icon-badge">
            <Phone size={22} />
          </div>
          <div>
            <h3 className="search-card-title">Search Customer Records by Mobile</h3>
            <p className="search-card-subtitle">
              Enter customer mobile number to populate full quotation, email, and booking date details.
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch}>
          <div className="search-form-row">
            <div className="input-group-custom">
              <label>Mobile Number</label>
              <div className="input-relative">
                <Search className="search-prefix-icon" size={18} />
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={mobileInput}
                  onChange={(e) => {
                    setMobileInput(e.target.value);
                    if (error) setError("");
                  }}
                  autoFocus
                />
                {mobileInput && (
                  <button
                    type="button"
                    className="clear-btn-inside"
                    onClick={handleClear}
                    title="Clear input"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-actions-buttons">
              <button
                type="submit"
                className="btn-search-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Search Customer Data
                  </>
                )}
              </button>

              {(hasSearched || mobileInput) && (
                <button
                  type="button"
                  className="btn-reset-secondary"
                  onClick={handleClear}
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Data Grid Results */}
      {hasSearched && (
        <div className="results-container">
          <div className="results-header-bar">
            <div className="results-count-title">
              <span>Customer Search Results</span>
              <span className="results-count-badge">
                {searchResults.length} {searchResults.length === 1 ? 'Record' : 'Records'}
              </span>
              {searchedTerm && (
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  for "{searchedTerm}"
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <button className="export-btn" onClick={exportToCSV}>
                <Download size={14} />
                Export Grid to CSV
              </button>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-box">
                <Inbox size={26} />
              </div>
              <h4 className="empty-title">No Matching Records Found</h4>
              <p className="empty-desc">
                We couldn't find any booking or quotation associated with mobile number "{searchedTerm}". Double-check the number or try searching with partial digits.
              </p>
            </div>
          ) : (
            <div className="grid-table-wrapper">
              <table className="custom-data-grid">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>User Email</th>
                    <th>Mobile Number</th>
                    <th>Quotation Number</th>
                    <th>Booking Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((row) => {
                    const initials = (row.userName || 'Customer')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr key={row.id}>
                        {/* 1. User Name */}
                        <td>
                          <div className="user-avatar-cell">
                            <div className="avatar-circle">{initials}</div>
                            <div>
                              <div className="user-name-text">{row.userName}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {row.fromLocation} → {row.toLocation}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. User Email */}
                        <td>
                          <a href={`mailto:${row.userEmail}`} className="user-email-text">
                            <Mail size={13} />
                            <span>{row.userEmail}</span>
                          </a>
                        </td>

                        {/* 3. Mobile Number */}
                        <td>
                          <span className="phone-badge">
                            <Phone size={12} />
                            {row.mobileNumber}
                          </span>
                        </td>

                        {/* 4. Quotation Number */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              className="quotation-download-btn"
                              onClick={() => handleDownloadQuotation(row)}
                              disabled={downloadingId === row.id}
                              title="Click to download Official Quotation PDF"
                            >
                              {downloadingId === row.id ? (
                                <RefreshCw className="animate-spin" size={13} />
                              ) : (
                                <FileDown size={14} />
                              )}
                              <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                {row.quotationNumber}
                              </span>
                              <Download size={12} style={{ opacity: 0.8 }} />
                            </button>
                            <button
                              className="btn-copy-sm"
                              onClick={() => handleCopy(row.quotationNumber)}
                              title="Copy Quotation Number"
                            >
                              {copiedCode === row.quotationNumber ? (
                                <Check size={14} style={{ color: '#16a34a' }} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 5. Booking Date */}
                        <td>
                          <div className="date-cell">
                            <Calendar size={14} style={{ color: '#2563eb' }} />
                            <span>{row.bookingDate}</span>
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td>
                          <span className={`status-pill-sub ${String(row.status).toLowerCase().replace(' ', '-')}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
