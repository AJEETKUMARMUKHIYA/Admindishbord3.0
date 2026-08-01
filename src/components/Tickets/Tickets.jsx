import React, { useState, useEffect, useMemo } from 'react';
import TicketTabs from './TicketTabs';
import * as XLSX from 'xlsx';
import { showToast } from '../../utils/toast';
import axiosClient from '../../AxiosClient';
import config from '../../config';
import './tickets.css';
import { 
  Search, 
  X, 
  Eye, 
  Check, 
  RefreshCw, 
  Download, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  User, 
  ArrowRight,
  Inbox,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  PlusCircle
} from 'lucide-react';

const ROWS_PER_PAGE = 12;

const Tickets = ({ tickets: initialTickets, supervisors, onAssignTicket, onUpdateTicket, onRefresh, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [ticketsList, setTicketsList] = useState(initialTickets || []);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState({
    new: 1,
    progress: 1,
    cancel: 1,
    closed: 1
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket currently open in the Inspection modal
  const [viewTicket, setViewTicket] = useState(null);

  // Sync with prop changes if parent updates
  useEffect(() => {
    if (initialTickets && initialTickets.length > 0) {
      setTicketsList(initialTickets);
    }
  }, [initialTickets]);

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

    const bId = item.bookingID || item.id || (index + 157);
    const tNo = item.ticketNo || item.ticketRef || `TCK-${bId}`;

    return {
      ...item,
      ticketID: item.ticketID || bId,
      ticketNo: tNo,
      bookingID: bId,
      quotationNumber: item.quotationNumber || '-',
      fromLocation: item.fromLocation || 'Not Specified',
      toLocation: item.toLocation || 'Not Specified',
      status: status,
      rawStatus: rawStatus,
      userName: item.userName || 'Customer',
      userEmail: item.userEmail || '',
      userPhone: item.userPhone || '',
      totalAmount: item.totalAmount || 0,
      bookingAmountPaid: item.bookingAmountPaid || item.paidAmount || 0,
      formattedPickupDate: item.formattedPickupDate || (item.pickupDate ? new Date(item.pickupDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'),
      assignedSupervisorID: item.assignedSupervisorID || item.supervisorId || null,
      reason: item.reason || item.cancellationReason || ''
    };
  };

  // Fetch directly from /Dashboard/recent-bookings
  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(config.urls.dashboardRecentBookings);
      // console.log('Fetched dashboardRecentBookings:', res.data);
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (items && items.length > 0) {
        const mapped = items.map(mapBookingToTicket);
        setTicketsList(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch dashboardRecentBookings endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard recent bookings on mount
  useEffect(() => {
    fetchRecentBookings();
  }, []);

  // ================= DATA FILTERING =================

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage({ new: 1, progress: 1, cancel: 1, closed: 1 });
  };

  const matchesSearch = (t) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      String(t.bookingID ?? '').toLowerCase().includes(query) ||
      String(t.ticketNo ?? '').toLowerCase().includes(query) ||
      String(t.quotationNumber ?? '').toLowerCase().includes(query) ||
      String(t.userName ?? '').toLowerCase().includes(query) ||
      String(t.fromLocation ?? '').toLowerCase().includes(query) ||
      String(t.toLocation ?? '').toLowerCase().includes(query)
    );
  };

  const newTickets = useMemo(
    () => ticketsList.filter(t => t.status === 'Open').filter(matchesSearch),
    [ticketsList, searchQuery]
  );
  const progressTickets = useMemo(
    () => ticketsList.filter(t => t.status === 'In Progress').filter(matchesSearch),
    [ticketsList, searchQuery]
  );
  const cancelledTickets = useMemo(
    () => ticketsList.filter(t => t.status === 'Cancelled').filter(matchesSearch),
    [ticketsList, searchQuery]
  );
  const closedTickets = useMemo(
    () => ticketsList.filter(t => t.status === 'Closed').filter(matchesSearch),
    [ticketsList, searchQuery]
  );

  // Compute metrics from ticketsList bound to dashboardRecentBookings
  const metrics = useMemo(() => {
    const total = ticketsList.length;
    const openCount = ticketsList.filter(t => t.status === 'Open').length;
    const progressCount = ticketsList.filter(t => t.status === 'In Progress').length;
    const closedCount = ticketsList.filter(t => t.status === 'Closed').length;
    const successRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

    return {
      total,
      openCount,
      progressCount,
      successRate
    };
  }, [ticketsList]);

  // ================= PAGINATION =================

  const paginate = (data, tab) => {
    const start = (currentPage[tab] - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  };

  const Pagination = ({ total, tab }) => {
    const pages = Math.ceil(total / ROWS_PER_PAGE);
    if (pages <= 1) return null;

    const current = currentPage[tab];

    return (
      <div className="tickets-pagination-bar">
        <ul className="tickets-pager">
          <li>
            <button
              type="button"
              className={`tickets-pager-btn ${current === 1 ? 'disabled' : ''}`}
              disabled={current === 1}
              onClick={() => setCurrentPage({ ...currentPage, [tab]: current - 1 })}
            >
              <ChevronLeft size={14} style={{ marginRight: 4 }} /> Prev
            </button>
          </li>

          {[...Array(pages)].map((_, i) => (
            <li key={i}>
              <button
                type="button"
                className={`tickets-pager-btn ${current === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage({ ...currentPage, [tab]: i + 1 })}
              >
                {i + 1}
              </button>
            </li>
          ))}

          <li>
            <button
              type="button"
              className={`tickets-pager-btn ${current === pages ? 'disabled' : ''}`}
              disabled={current === pages}
              onClick={() => setCurrentPage({ ...currentPage, [tab]: current + 1 })}
            >
              Next <ChevronRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </li>
        </ul>
      </div>
    );
  };

  // ================= ACTIONS =================

  const handleStatusChange = (id, newStatus) => {
    if (window.confirm(`Are you sure you want to change ticket status to: ${newStatus}?`)) {
      setTicketsList(prev => prev.map(t => t.ticketID === id ? { ...t, status: newStatus } : t));
      if (onUpdateTicket) onUpdateTicket(id, { status: newStatus });
      showToast(`Ticket status updated to ${newStatus}`, 'success');
    }
  };

  const handleResync = async () => {
    await fetchRecentBookings();
    if (onRefresh) onRefresh();
    showToast('Re-synced with dashboardRecentBookings endpoint!', 'success');
  };

  const handleDownloadExcel = () => {
    const data = ticketsList.map(t => ({
      'Ticket Ref': t.ticketNo,
      'Booking ID': `#${t.bookingID}`,
      'Quotation Number': t.quotationNumber,
      'Customer Name': t.userName,
      'Customer Email': t.userEmail,
      'Origin': t.fromLocation,
      'Destination': t.toLocation,
      'Pickup Date': t.formattedPickupDate,
      'Total Amount': t.totalAmount,
      'Amount Paid': t.bookingAmountPaid,
      'Current Status': t.status,
      'Assigned Supervisor':
        supervisors.find(s => s.userId === t.assignedSupervisorID)?.firstName || 'Unassigned'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Recent Bookings');
    XLSX.writeFile(wb, 'Recent_Bookings_Tickets_Report.xlsx');

    showToast('Recent Bookings report exported to Excel', 'success');
  };

  const handleView = (ticket) => {
    setViewTicket(ticket);
  };

  const closeViewModal = () => setViewTicket(null);

  const viewTicketSupervisor = viewTicket && supervisors
    ? supervisors.find(s => s.userId === viewTicket.assignedSupervisorID)
    : null;

  return (
    <div id="tickets">
      
      {/* Header Eyebrow and Titles */}
      <div className="tickets-header">
        <div className="tickets-eyebrow">
          <ShieldAlert size={12} /> System Logistics & Field Operations Hub
        </div>
        <h1 className="tickets-title">Ticket Management</h1>
        <p className="tickets-subtitle">
          Monitor dispatch assignments, track live supervisor activity logs, and resolve transport operational tickets.
        </p>
      </div>

      {/* Operational Metrics Grid */}
      <div className="tickets-metrics-grid">
        <div className="tickets-metric-card">
          <div className="tickets-metric-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Inbox size={20} />
          </div>
          <div className="tickets-metric-info">
            <span className="tickets-metric-label">Operational Load</span>
            <span className="tickets-metric-val">{metrics.total}</span>
          </div>
        </div>

        <div className="tickets-metric-card">
          <div className="tickets-metric-icon-wrapper" style={{ backgroundColor: '#fefbeb', color: '#d97706' }}>
            <AlertCircle size={20} />
          </div>
          <div className="tickets-metric-info">
            <span className="tickets-metric-label">Unresolved (New)</span>
            <span className="tickets-metric-val">{metrics.openCount}</span>
          </div>
        </div>

        <div className="tickets-metric-card">
          <div className="tickets-metric-icon-wrapper" style={{ backgroundColor: '#ecfeff', color: '#0891b2' }}>
            <Clock size={20} />
          </div>
          <div className="tickets-metric-info">
            <span className="tickets-metric-label">In Progress</span>
            <span className="tickets-metric-val">{metrics.progressCount}</span>
          </div>
        </div>

        <div className="tickets-metric-card">
          <div className="tickets-metric-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <TrendingUp size={20} />
          </div>
          <div className="tickets-metric-info">
            <span className="tickets-metric-label">Completion Efficiency</span>
            <span className="tickets-metric-val">{metrics.successRate}%</span>
          </div>
        </div>
      </div>

      {/* Outer Card Frame */}
      <div className="tickets-card-frame">
        
        {/* Navigation Tabs Header */}
        <TicketTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tickets={ticketsList}
        />

        {/* Search and Quick Filters Strip */}
        <div className="tickets-control-strip">
          <div className="tickets-search-box">
            <Search size={16} className="tickets-search-icon" />
            <input
              type="text"
              className="tickets-search-input"
              placeholder="Filter by Booking ID..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="tickets-search-clear" onClick={() => handleSearchChange({ target: { value: '' } })}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="tickets-actions-group">
            {onNavigate && (
              <button className="btn-formal btn-formal-gradient" onClick={() => onNavigate('bookingForm')}>
                <PlusCircle size={14} />
                Book New Ticket
              </button>
            )}
            <button className="btn-formal btn-formal-outline" onClick={handleResync} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'vm-spin' : ''} />
              Re-sync
            </button>
            <button className="btn-formal btn-formal-outline" onClick={handleDownloadExcel}>
              <Download size={14} />
              Export Report
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="tickets-table-container">
          
          {/* ================= OPEN TICKETS ================= */}
          {activeTab === 'new' && (
            <>
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Quotation Number</th>
                    <th>Booking ID</th>
                    <th>Logistical Route</th>
                    <th>Current Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newTickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '48px 24px' }}>
                        {searchQuery
                          ? `No open tickets found matching search "${searchQuery}".`
                          : 'Operational database is currently clear of open tickets.'}
                      </td>
                    </tr>
                  ) : (
                    paginate(newTickets, 'new').map(t => (
                      <tr key={t.ticketID}>
                        <td><span className="ticket-code">{t.quotationNumber}</span></td>
                        <td><span className="booking-code">#{t.bookingID}</span></td>
                        <td>
                          <div className="route-text">
                            <MapPin size={13} style={{ color: '#94a3b8' }} />
                            <span>{t.fromLocation}</span>
                            <ArrowRight size={12} className="route-arrow" />
                            <span>{t.toLocation}</span>
                          </div>
                        </td>
                        <td>
                          {/* <span className="tickets-badge badge-open">{t.bookingStatus}</span> */}
                           <span className={`status-pill status-pill--${t.bookingStatus?.toLowerCase().replace(' ', '-')}`}>
                            {t.bookingStatus}
                            </span>
                          </td>
                        <td>
                          <div className="action-buttons-wrap">
                            <button
                              type="button"
                              className="btn-action-round"
                              title="Inspect Details"
                              onClick={() => handleView(t)}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <Pagination total={newTickets.length} tab="new" />
            </>
          )}

          {/* ================= IN PROGRESS TICKETS ================= */}
          {activeTab === 'progress' && (
            <>
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Quotation Number</th>
                    <th>Booking ID</th>
                    <th>Logistical Route</th>
                    <th>Current Status</th>
                    <th>Supervisor assigned</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {progressTickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '48px 24px' }}>
                        {searchQuery
                          ? `No in-progress tickets found matching search "${searchQuery}".`
                          : 'No operations currently in transit.'}
                      </td>
                    </tr>
                  ) : (
                    paginate(progressTickets, 'progress').map(t => {
                      const sup = supervisors ? supervisors.find(s => s.userId === t.assignedSupervisorID) : null;
                      return (
                        <tr key={t.ticketID}>
                          <td><span className="ticket-code">{t.quotationNumber}</span></td>
                          <td><span className="booking-code">#{t.bookingID}</span></td>
                          <td>
                            <div className="route-text">
                              <MapPin size={13} style={{ color: '#94a3b8' }} />
                              <span>{t.fromLocation}</span>
                              <ArrowRight size={12} className="route-arrow" />
                              <span>{t.toLocation}</span>
                            </div>
                          </td>
                          <td><span className="tickets-badge badge-progress">In Progress</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 500 }}>
                              <User size={13} style={{ color: '#64748b' }} />
                              <span>{sup ? `${sup.firstName} ${sup.lastName}` : 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-wrap">
                              <button
                                type="button"
                                className="btn-action-round"
                                title="Inspect Details"
                                onClick={() => handleView(t)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-action-round success"
                                title="Close & Resolve Ticket"
                                onClick={() => handleStatusChange(t.ticketID, 'Closed')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-action-round danger"
                                title="Cancel Ticket"
                                onClick={() => handleStatusChange(t.ticketID, 'Cancelled')}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <Pagination total={progressTickets.length} tab="progress" />
            </>
          )}

          {/* ================= CANCELLED TICKETS ================= */}
          {activeTab === 'cancel' && (
            <>
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Quotation Number</th>
                    <th>Booking ID</th>
                    <th>Logistical Route</th>
                    <th>Current Status</th>
                    <th>Cancellation Incident Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledTickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '48px 24px' }}>
                        {searchQuery
                          ? `No cancelled tickets found matching search "${searchQuery}".`
                          : 'No cancelled incident logs recorded.'}
                      </td>
                    </tr>
                  ) : (
                    paginate(cancelledTickets, 'cancel').map(t => (
                      <tr key={t.ticketID}>
                        <td><span className="ticket-code">{t.quotationNumber}</span></td>
                        <td><span className="booking-code">#{t.bookingID}</span></td>
                        <td>
                          <div className="route-text">
                            <MapPin size={13} style={{ color: '#94a3b8' }} />
                            <span>{t.fromLocation}</span>
                            <ArrowRight size={12} className="route-arrow" />
                            <span>{t.toLocation}</span>
                          </div>
                        </td>
                        <td><span className="tickets-badge badge-cancelled">Cancelled</span></td>
                        <td style={{ color: '#ef4444', fontWeight: 500, fontSize: '13px' }}>
                          {t.reason || 'No cancellation reason provided.'}
                        </td>
                        <td>
                          <div className="action-buttons-wrap">
                            <button
                              type="button"
                              className="btn-action-round"
                              title="Inspect Details"
                              onClick={() => handleView(t)}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <Pagination total={cancelledTickets.length} tab="cancel" />
            </>
          )}

          {/* ================= RESOLVED TICKETS ================= */}
          {activeTab === 'closed' && (
            <>
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Quotation Number</th>
                    <th>Booking ID</th>
                    <th>Logistical Route</th>
                    <th>Current Status</th>
                    <th>Assigned Supervisor</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '48px 24px' }}>
                        {searchQuery
                          ? `No closed tickets found matching search "${searchQuery}".`
                          : 'No resolved tickets logged in history archive.'}
                      </td>
                    </tr>
                  ) : (
                    paginate(closedTickets, 'closed').map(t => {
                      const sup = supervisors ? supervisors.find(s => s.userId === t.assignedSupervisorID) : null;
                      return (
                        <tr key={t.ticketID}>
                          <td><span className="ticket-code">{t.quotationNumber}</span></td>
                          <td><span className="booking-code">#{t.bookingID}</span></td>
                          <td>
                            <div className="route-text">
                              <MapPin size={13} style={{ color: '#94a3b8' }} />
                              <span>{t.fromLocation}</span>
                              <ArrowRight size={12} className="route-arrow" />
                              <span>{t.toLocation}</span>
                            </div>
                          </td>
                          <td><span className="tickets-badge badge-closed">Closed</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 500 }}>
                              <User size={13} style={{ color: '#64748b' }} />
                              <span>{sup ? `${sup.firstName} ${sup.lastName}` : '—'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-wrap">
                              <button
                                type="button"
                                className="btn-action-round"
                                title="Inspect Details"
                                onClick={() => handleView(t)}
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <Pagination total={closedTickets.length} tab="closed" />
            </>
          )}
        </div>
      </div>

      {/* ================= VIEW TICKET DETAIL MODAL ================= */}
      {viewTicket && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h5 className="modal-card-title">Inspection Log: {viewTicket.ticketNo}</h5>
              <button type="button" className="btn-close-modal" onClick={closeViewModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-card-body">
              <div className="modal-detail-row">
                <div className="modal-detail-label">Booking Reference</div>
                <div className="modal-detail-value">
                  <span className="booking-code" style={{ padding: '3px 8px', fontSize: '12.5px' }}>
                    #{viewTicket.bookingID}
                  </span>
                </div>
              </div>

              {viewTicket.quotationNumber && (
                <div className="modal-detail-row">
                  <div className="modal-detail-label">Quotation Number</div>
                  <div className="modal-detail-value" style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, color: '#2563eb' }}>
                    {viewTicket.quotationNumber}
                  </div>
                </div>
              )}

              {viewTicket.userName && (
                <div className="modal-detail-row">
                  <div className="modal-detail-label">Customer Details</div>
                  <div className="modal-detail-value" style={{ fontWeight: 600 }}>
                    {viewTicket.userName}
                    {viewTicket.userEmail && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>{viewTicket.userEmail}</div>}
                  </div>
                </div>
              )}

              <div className="modal-detail-row">
                <div className="modal-detail-label">Origin Station</div>
                <div className="modal-detail-value" style={{ fontWeight: 500 }}>{viewTicket.fromLocation}</div>
              </div>

              <div className="modal-detail-row">
                <div className="modal-detail-label">Destination Station</div>
                <div className="modal-detail-value" style={{ fontWeight: 500 }}>{viewTicket.toLocation}</div>
              </div>

              {viewTicket.formattedPickupDate && (
                <div className="modal-detail-row">
                  <div className="modal-detail-label">Pickup Schedule</div>
                  <div className="modal-detail-value" style={{ fontWeight: 500 }}>{viewTicket.formattedPickupDate}</div>
                </div>
              )}

              {viewTicket.totalAmount > 0 && (
                <div className="modal-detail-row">
                  <div className="modal-detail-label">Financial Clearance</div>
                  <div className="modal-detail-value" style={{ fontWeight: 600 }}>
                    Total: ₹{viewTicket.totalAmount?.toLocaleString('en-IN')} | Paid: ₹{viewTicket.bookingAmountPaid?.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div className="modal-detail-row">
                <div className="modal-detail-label">Operational Status</div>
                <div className="modal-detail-value">
                  {viewTicket.status === 'Open' && <span className="tickets-badge badge-open">Open / Provisioned</span>}
                  {viewTicket.status === 'In Progress' && <span className="tickets-badge badge-progress">In Progress</span>}
                  {viewTicket.status === 'Cancelled' && <span className="tickets-badge badge-cancelled">Cancelled</span>}
                  {viewTicket.status === 'Closed' && <span className="tickets-badge badge-closed">Closed / Resolved</span>}
                </div>
              </div>

              <div className="modal-detail-row">
                <div className="modal-detail-label">Assigned Dispatcher</div>
                <div className="modal-detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <User size={13} style={{ color: '#64748b' }} />
                  <span>
                    {viewTicketSupervisor
                      ? `${viewTicketSupervisor.firstName} ${viewTicketSupervisor.lastName}`
                      : 'Unassigned / Not Provisioned'}
                  </span>
                </div>
              </div>

              {viewTicket.reason && (
                <div className="modal-detail-row" style={{ backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fee2e2', marginTop: '12px' }}>
                  <div className="modal-detail-label" style={{ color: '#ef4444' }}>Incident Reason</div>
                  <div className="modal-detail-value" style={{ color: '#b91c1c', fontWeight: 500 }}>{viewTicket.reason}</div>
                </div>
              )}

              {/* Graphical Process Timeline Tracker */}
              <div className="ticket-process-timeline">
                {/* Step 1: Open */}
                <div className={`timeline-step ${
                  viewTicket.status === 'Open' ? 'active' : 
                  (viewTicket.status === 'In Progress' || viewTicket.status === 'Closed' ? 'completed' : '')
                }`}>
                  <div className="timeline-node">1</div>
                  <div className="timeline-label">Open</div>
                </div>

                {/* Step 2: In Progress */}
                <div className={`timeline-step ${
                  viewTicket.status === 'In Progress' ? 'active' : 
                  (viewTicket.status === 'Closed' ? 'completed' : '')
                }`}>
                  <div className="timeline-node">2</div>
                  <div className="timeline-label">In Transit</div>
                </div>

                {/* Step 3: Resolved / Cancelled */}
                {viewTicket.status === 'Cancelled' ? (
                  <div className="timeline-step cancelled">
                    <div className="timeline-node"><X size={10} /></div>
                    <div className="timeline-label">Cancelled</div>
                  </div>
                ) : (
                  <div className={`timeline-step ${viewTicket.status === 'Closed' ? 'completed' : ''}`}>
                    <div className="timeline-node">3</div>
                    <div className="timeline-label">Resolved</div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-card-footer">
              <button type="button" className="btn-formal btn-formal-outline" onClick={closeViewModal}>
                Dismiss Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
