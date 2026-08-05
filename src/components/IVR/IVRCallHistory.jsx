import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Play, 
  Pause, 
  Download, 
  Plus, 
  X, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Ticket, 
  Headphones, 
  RefreshCw,
  Edit3,
  Save,
  MessageSquare
} from 'lucide-react';
import { showToast } from '../ToastNotification';
import './IVRCallHistory.css';

export default function IVRCallHistory({ onNavigate, supervisors = [], tickets = [] }) {
  const [callLogs, setCallLogs] = useState(() => {
    const saved = localStorage.getItem('packyatra_ivr_call_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');

  // Modal / Drawer Selection
  const [selectedLog, setSelectedLog] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Note editing inside drawer
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // New Manual Call Entry Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCallerName, setNewCallerName] = useState('');
  const [newCallerPhone, setNewCallerPhone] = useState('');
  const [newDirection, setNewDirection] = useState('Inbound');
  const [newStatus, setNewStatus] = useState('Completed');
  const [newDurationMin, setNewDurationMin] = useState('2');
  
  const defaultAgent = supervisors.length > 0 ? `${supervisors[0].firstName || ''} ${supervisors[0].lastName || ''}`.trim() : 'System Operator';
  const defaultTicket = tickets.length > 0 ? `#${tickets[0].bookingID || tickets[0].ticketNumber || tickets[0].id}` : '';

  const [newAgentName, setNewAgentName] = useState(defaultAgent);
  const [newTicketId, setNewTicketId] = useState(defaultTicket);
  const [newNotes, setNewNotes] = useState('');

  // Keep localStorage synced
  useEffect(() => {
    localStorage.setItem('packyatra_ivr_call_history', JSON.stringify(callLogs));
  }, [callLogs]);

  // Audio waveform simulation
  useEffect(() => {
    let interval = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 4;
        });
      }, 250);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Helper to format seconds -> mins & secs
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Filtered Calls
  const filteredLogs = callLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      log.callerName.toLowerCase().includes(q) ||
      log.callerPhone.includes(q) ||
      log.id.toLowerCase().includes(q) ||
      log.agentName.toLowerCase().includes(q) ||
      (log.ticketId && log.ticketId.toLowerCase().includes(q));

    const matchesDirection = directionFilter === 'All' || log.direction === directionFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesQuery && matchesDirection && matchesStatus;
  });

  // Calculate KPIs
  const totalCalls = callLogs.length;
  const completedCalls = callLogs.filter((l) => l.status === 'Completed').length;
  const missedCalls = callLogs.filter((l) => l.status === 'Missed').length;
  const totalSeconds = callLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
  const answerRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 100;

  // Open log modal
  const handleOpenLogDetails = (log) => {
    setSelectedLog(log);
    setEditedNotes(log.notes || '');
    setIsEditingNotes(false);
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  // Save edited notes
  const handleSaveNotes = () => {
    if (!selectedLog) return;
    const updated = callLogs.map((l) => l.id === selectedLog.id ? { ...l, notes: editedNotes } : l);
    setCallLogs(updated);
    setSelectedLog({ ...selectedLog, notes: editedNotes });
    setIsEditingNotes(false);
    showToast.success("Call notes updated successfully!");
  };

  // Submit New Manual Call Log
  const handleCreateCallLog = (e) => {
    e.preventDefault();
    if (!newCallerName || !newCallerPhone) {
      showToast.error("Please provide caller name and phone number");
      return;
    }

    const durationSec = parseInt(newDurationMin || '1') * 60;
    const newLog = {
      id: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      callerName: newCallerName,
      callerPhone: newCallerPhone,
      direction: newDirection,
      status: newStatus,
      agentName: newAgentName,
      extension: 'Ext 101',
      durationSeconds: newStatus === 'Missed' ? 0 : durationSec,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      ivrPath: ['Direct Operator Call'],
      ticketId: newTicketId || '#1024',
      moveType: 'Relocation Customer Query',
      sentiment: newStatus === 'Completed' ? 'Satisfied' : 'Missed',
      aiSummary: `Manual call entry recorded by dispatch operator. Notes: ${newNotes || 'None'}`,
      notes: newNotes || 'Manual call record created.'
    };

    setCallLogs([newLog, ...callLogs]);
    setShowAddModal(false);
    setNewCallerName('');
    setNewCallerPhone('');
    setNewNotes('');
    showToast.success(`New call record ${newLog.id} added to call history!`);
  };

  // Export Call History to CSV
  const handleExportCSV = () => {
    const headers = ['Call ID', 'Caller Name', 'Caller Phone', 'Direction', 'Status', 'Agent / Extension', 'Duration', 'Ticket', 'Timestamp', 'Notes'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.callerName}"`,
      `"${l.callerPhone}"`,
      l.direction,
      l.status,
      `"${l.agentName}"`,
      formatDuration(l.durationSeconds),
      l.ticketId || '-',
      `"${l.timestamp}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PackYatra_IVR_CallHistory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success("Exported Call History CSV!");
  };

  return (
    <div className="ivr-call-history-page">
      {/* Page Title & Actions Header */}
      <div className="history-header">
        <div className="title-area">
          <div className="icon-badge">
            <Headphones size={24} />
          </div>
          <div>
            <h1>IVR Call History & Logs</h1>
            <p>Complete records of incoming and outgoing customer calls, caller IDs, talk durations, agent extensions, and AI call notes.</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Log Manual Call
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper blue">
            <PhoneCall size={20} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Total Calls Logged</div>
            <div className="kpi-value">{totalCalls}</div>
            <div className="kpi-sub">Across all extensions</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper green">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Answer Rate</div>
            <div className="kpi-value text-green">{answerRate}%</div>
            <div className="kpi-sub">{completedCalls} answered calls</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper purple">
            <Clock size={20} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Avg Talk Duration</div>
            <div className="kpi-value">{formatDuration(avgDuration)}</div>
            <div className="kpi-sub">Total {Math.round(totalSeconds / 60)} mins</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper red">
            <PhoneMissed size={20} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Missed Calls</div>
            <div className="kpi-value text-red">{missedCalls}</div>
            <div className="kpi-sub">Requires follow-up</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filters-card">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Caller ID, Name, Phone (+91...), Ticket # or Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <Filter size={14} />
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
              <option value="All">All Directions</option>
              <option value="Inbound">Inbound Calls</option>
              <option value="Outbound">Outbound Calls</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>
          </div>

          <div className="results-count-pill">
            Showing <strong>{filteredLogs.length}</strong> of {callLogs.length} logs
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="history-table-container">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <PhoneCall size={36} color="#94a3b8" />
            <h3>No Call Logs Found</h3>
            <p>No call history matched your search filters. Try clearing search keywords.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Call ID</th>
                <th>Caller ID / Customer</th>
                <th>Direction</th>
                <th>Status</th>
                <th>Assigned Agent / Extension</th>
                <th>Linked Ticket</th>
                <th>Duration</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="history-row" onClick={() => handleOpenLogDetails(log)}>
                  <td>
                    <span className="call-id-code">{log.id}</span>
                  </td>

                  <td>
                    <div className="caller-profile-cell">
                      <div className="caller-avatar">
                        {log.callerName ? log.callerName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="caller-name">{log.callerName}</div>
                        <div className="caller-phone">{log.callerPhone}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`direction-badge ${log.direction.toLowerCase()}`}>
                      {log.direction === 'Inbound' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                      {log.direction}
                    </span>
                  </td>

                  <td>
                    <span className={`status-badge-pill ${log.status.toLowerCase()}`}>
                      {log.status === 'Completed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {log.status}
                    </span>
                  </td>

                  <td>
                    <div className="agent-cell-name">{log.agentName}</div>
                    <div className="agent-cell-ext">{log.extension || 'Ext 101'}</div>
                  </td>

                  <td>
                    {log.ticketId ? (
                      <span className="ticket-link-badge">
                        <Ticket size={11} /> {log.ticketId}
                      </span>
                    ) : (
                      <span className="none-text">-</span>
                    )}
                  </td>

                  <td>
                    <span className="duration-text">{formatDuration(log.durationSeconds)}</span>
                  </td>

                  <td>
                    <span className="timestamp-text">{log.timestamp}</span>
                  </td>

                  <td onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-view-log"
                      onClick={() => handleOpenLogDetails(log)}
                    >
                      <FileText size={14} /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================================================
          LOG DETAILS & AUDIO RECORDING DRAWER MODAL
         ========================================================= */}
      {selectedLog && (
        <div className="drawer-overlay" onClick={() => setSelectedLog(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="header-info">
                <div className="call-id-title">{selectedLog.id}</div>
                <div className="call-time-sub">{selectedLog.timestamp}</div>
              </div>
              <button className="btn-close-drawer" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Caller & Agent Cards */}
              <div className="info-cards-row">
                <div className="info-card">
                  <div className="info-card-label">Caller ID / Customer</div>
                  <div className="info-card-value">{selectedLog.callerName}</div>
                  <div className="info-card-sub">{selectedLog.callerPhone}</div>
                  <div className="info-card-tag">{selectedLog.moveType || 'General Moving Inquiry'}</div>
                </div>

                <div className="info-card">
                  <div className="info-card-label">Assigned Extension</div>
                  <div className="info-card-value">{selectedLog.agentName}</div>
                  <div className="info-card-sub">{selectedLog.extension || 'Ext 101'}</div>
                  <div className="info-card-sub">Duration: <strong>{formatDuration(selectedLog.durationSeconds)}</strong></div>
                </div>
              </div>

              {/* Simulated Recorded Audio Playback */}
              <div className="audio-recording-player">
                <div className="recording-title">
                  <Headphones size={15} /> IVR Recorded Call Audio
                </div>
                <div className="recording-controls">
                  <button 
                    className="btn-play-pause"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  >
                    {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${audioProgress}%` }}></div>
                  </div>

                  <div className="audio-timer">
                    {Math.floor((selectedLog.durationSeconds * (audioProgress / 100)) / 60)}:
                    {Math.floor((selectedLog.durationSeconds * (audioProgress / 100)) % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* IVR Traversal Path */}
              {selectedLog.ivrPath && selectedLog.ivrPath.length > 0 && (
                <div className="section-block">
                  <div className="block-title">IVR DTMF Path Traversed</div>
                  <div className="ivr-steps-chain">
                    {selectedLog.ivrPath.map((step, idx) => (
                      <span key={idx} className="step-tag">
                        {step} {idx < selectedLog.ivrPath.length - 1 && <ChevronRight size={12} />}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Auto Summary */}
              {selectedLog.aiSummary && (
                <div className="section-block ai-summary">
                  <div className="block-title text-blue">
                    <Sparkles size={14} /> AI Call Summary & Key Takeaways
                  </div>
                  <p className="summary-paragraph">{selectedLog.aiSummary}</p>
                </div>
              )}

              {/* Follow-up Notes Editor */}
              <div className="section-block">
                <div className="notes-header">
                  <span className="block-title">Supervisor Call Notes</span>
                  {!isEditingNotes ? (
                    <button className="btn-edit-notes" onClick={() => setIsEditingNotes(true)}>
                      <Edit3 size={13} /> Edit
                    </button>
                  ) : (
                    <button className="btn-save-notes" onClick={handleSaveNotes}>
                      <Save size={13} /> Save Notes
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea 
                    className="notes-textarea"
                    rows={4}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                  />
                ) : (
                  <div className="notes-display-box">
                    {selectedLog.notes || 'No supervisor notes recorded for this call.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          LOG MANUAL CALL MODAL
         ========================================================= */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={18} /> Log Manual Customer Call</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCallLog} className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Caller Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rahul Sharma"
                    value={newCallerName}
                    onChange={(e) => setNewCallerName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Caller Phone Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. +91 98765 43210"
                    value={newCallerPhone}
                    onChange={(e) => setNewCallerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Direction</label>
                  <select value={newDirection} onChange={(e) => setNewDirection(e.target.value)}>
                    <option value="Inbound">Inbound (Incoming)</option>
                    <option value="Outbound">Outbound (Outgoing)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="Completed">Completed</option>
                    <option value="Missed">Missed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Talk Duration (Minutes)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={newDurationMin}
                    onChange={(e) => setNewDurationMin(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Link Ticket ID</label>
                  {tickets.length > 0 ? (
                    <select
                      value={newTicketId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewTicketId(val);
                        const match = tickets.find(t => `#${t.bookingID || t.ticketNumber || t.id}` === val);
                        if (match) {
                          if (match.customerName || match.name) setNewCallerName(match.customerName || match.name);
                          if (match.customerPhone || match.phone) setNewCallerPhone(match.customerPhone || match.phone);
                        }
                      }}
                    >
                      <option value="">-- None / General Call --</option>
                      {tickets.map((t, idx) => {
                        const code = `#${t.bookingID || t.ticketNumber || t.id}`;
                        return (
                          <option key={idx} value={code}>
                            {code} - {t.customerName || t.fromLocation || 'Booking'}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="e.g. #1024"
                      value={newTicketId}
                      onChange={(e) => setNewTicketId(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="form-field">
                <label>Assigned Representative</label>
                {supervisors.length > 0 ? (
                  <select 
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  >
                    {supervisors.map((s, idx) => {
                      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Supervisor';
                      return (
                        <option key={idx} value={`${sName} (Supervisor)`}>
                          {sName} (Ext 10{idx + 1})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Representative Name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                )}
              </div>

              <div className="form-field">
                <label>Call Summary / Notes</label>
                <textarea 
                  rows={3} 
                  placeholder="Informed customer about truck arrival timeline and transit inventory..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Call Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
