import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Volume2, 
  Users, 
  UserCheck, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Headphones, 
  Radio, 
  Settings, 
  Tag, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ListOrdered,
  X,
  MessageSquare
} from 'lucide-react';
import { showToast } from '../ToastNotification';
import './IVRSystem.css';

export default function IVRSystem({ supervisors = [], adminUsers = [], tickets = [], userData, onNavigate }) {
  const [activeTab, setActiveTab] = useState('callCenter'); // 'callCenter', 'agents', 'logs', 'ivrFlow'
  const [callLogs, setCallLogs] = useState(() => {
    const saved = localStorage.getItem('packyatra_ivr_call_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Agents list combining Supervisors, Admins & Logged in user
  const [agents, setAgents] = useState(() => {
    const saved = localStorage.getItem('packyatra_ivr_agents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing saved ivr agents", e);
      }
    }

    const initialAgents = [];
    if (userData && (userData.firstName || userData.name)) {
      initialAgents.push({
        id: userData.userId || 'admin-1',
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'Logged User',
        role: userData.role === 1 ? 'Admin / Dispatch Manager' : 'Field Supervisor',
        extension: '100',
        status: 'Available', // 'Available', 'Busy', 'On Break', 'Offline'
        callsToday: 0,
        avgDuration: '0m',
        department: 'Operations & Escalation'
      });
    }

    if (Array.isArray(adminUsers)) {
      adminUsers.forEach((adm, idx) => {
        if (!initialAgents.some(a => a.id === adm.userId)) {
          initialAgents.push({
            id: adm.userId || `adm-${idx + 1}`,
            name: `${adm.firstName || ''} ${adm.lastName || ''}`.trim() || adm.username || 'Admin',
            role: 'Administrator',
            extension: `10${idx}`,
            status: 'Available',
            callsToday: 0,
            avgDuration: '0m',
            department: 'System Admin'
          });
        }
      });
    }

    if (Array.isArray(supervisors)) {
      supervisors.forEach((sup, idx) => {
        if (!initialAgents.some(a => a.id === sup.userId)) {
          initialAgents.push({
            id: sup.userId || `sup-${idx + 1}`,
            name: `${sup.firstName || ''} ${sup.lastName || ''}`.trim() || sup.name || 'Supervisor',
            role: 'Field Supervisor',
            extension: `10${idx + 1}`,
            status: 'Available',
            callsToday: 0,
            avgDuration: '0m',
            department: 'Relocation & Transit'
          });
        }
      });
    }

    return initialAgents;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('packyatra_ivr_call_history', JSON.stringify(callLogs));
  }, [callLogs]);

  useEffect(() => {
    localStorage.setItem('packyatra_ivr_agents', JSON.stringify(agents));
  }, [agents]);

  // Active Simulated Call State
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callNotesInput, setCallNotesInput] = useState('');
  const [selectedAgentForCall, setSelectedAgentForCall] = useState('');
  
  const initialTicket = tickets && tickets.length > 0 ? tickets[0] : null;
  const [selectedTicketId, setSelectedTicketId] = useState(
    initialTicket ? `#${initialTicket.bookingID || initialTicket.ticketNumber || initialTicket.id}` : ''
  );
  const [customCallerName, setCustomCallerName] = useState(
    initialTicket ? (initialTicket.customerName || initialTicket.name || '') : ''
  );
  const [customCallerPhone, setCustomCallerPhone] = useState(
    initialTicket ? (initialTicket.customerPhone || initialTicket.phone || '') : ''
  );
  const [dtmfLog, setDtmfLog] = useState([]);

  // Auto populate caller info when ticket selection changes
  const handleTicketSelectChange = (tVal) => {
    setSelectedTicketId(tVal);
    if (!tVal) return;
    const match = tickets.find(t => {
      const code = `#${t.bookingID || t.ticketNumber || t.id}`;
      return code === tVal || t.id === tVal || t.bookingID === tVal;
    });
    if (match) {
      if (match.customerName || match.name) {
        setCustomCallerName(match.customerName || match.name);
      }
      if (match.customerPhone || match.phone) {
        setCustomCallerPhone(match.customerPhone || match.phone);
      }
    }
  };

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Filters for History Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Timer Ref for Active Call
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (activeCall && activeCall.status === 'Connected') {
      timerIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [activeCall]);

  // Audio wave playback interval simulation
  useEffect(() => {
    let interval = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Start Simulated Inbound Call
  const handleStartInboundCall = () => {
    if (activeCall) {
      showToast.error("A call is already in progress!");
      return;
    }

    const defaultAgent = agents.find(a => a.status === 'Available') || agents[0];

    const newCall = {
      id: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      callerName: customCallerName || 'Inbound Caller',
      callerPhone: customCallerPhone || '+91 98000 11122',
      direction: 'Inbound',
      status: 'IVR Menu',
      agentName: defaultAgent ? `${defaultAgent.name} (${defaultAgent.extension})` : 'System Queue',
      agentId: defaultAgent?.id || null,
      extension: defaultAgent ? `Ext ${defaultAgent.extension}` : 'Ext 100',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ivrStep: 'Welcome Greeting & Menu Prompt',
      ticketId: selectedTicketId || '#1024',
      moveType: '2BHK Relocation Query'
    };

    setActiveCall(newCall);
    setCallTimer(0);
    setDtmfLog(['Greeting Prompt Initiated']);
    setSelectedAgentForCall(defaultAgent?.id || '');
    showToast.info(`Simulated Inbound Call from ${newCall.callerName}`);
  };

  // Handle DTMF Keypress (0-9)
  const handleDtmfPress = (key) => {
    if (!activeCall) return;

    let stepText = `DTMF Key ${key} Pressed`;
    let ivrAction = '';

    switch (key) {
      case '1':
        ivrAction = 'Option 1: Relocation Quote & Instant Estimate';
        break;
      case '2':
        ivrAction = 'Option 2: Order Tracking & Consignment Status';
        break;
      case '3':
        ivrAction = 'Option 3: Connect to Field Supervisor';
        break;
      case '4':
        ivrAction = 'Option 4: Fleet & Truck Dispatch Details';
        break;
      case '9':
        ivrAction = 'Option 9: Billing & Invoicing Inquiry';
        break;
      case '0':
        ivrAction = 'Option 0: Emergency Escalation Priority';
        break;
      default:
        ivrAction = `Option ${key}: Automated System Response`;
    }

    setDtmfLog((prev) => [...prev, `${key} - ${ivrAction}`]);
    setActiveCall((prev) => ({
      ...prev,
      ivrStep: ivrAction
    }));

    showToast.success(`DTMF Pressed: [${key}] - ${ivrAction}`);
  };

  // Connect Call to Agent
  const handleConnectCall = () => {
    if (!activeCall) return;
    const agent = agents.find(a => a.id === selectedAgentForCall) || agents[0];

    setActiveCall((prev) => ({
      ...prev,
      status: 'Connected',
      agentName: agent ? `${agent.name}` : 'Operator',
      agentId: agent?.id,
      extension: agent ? `Ext ${agent.extension}` : 'Ext 100',
      ivrStep: 'Call Connected with Representative'
    }));

    // Update agent status to In Call
    if (agent) {
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'In Call' } : a));
    }

    showToast.success(`Call connected to ${agent?.name || 'Agent'}`);
  };

  // End Call & Save to Log History
  const handleEndCall = () => {
    if (!activeCall) return;

    const formattedDuration = `${Math.floor(callTimer / 60)}m ${callTimer % 60}s`;

    const finishedLog = {
      id: activeCall.id,
      callerName: activeCall.callerName,
      callerPhone: activeCall.callerPhone,
      direction: activeCall.direction,
      status: activeCall.status === 'Connected' ? 'Completed' : 'Missed',
      agentName: activeCall.agentName,
      agentId: activeCall.agentId,
      extension: activeCall.extension,
      durationSeconds: callTimer,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      ivrPath: dtmfLog.length > 0 ? dtmfLog : ['Welcome Greeting'],
      ticketId: activeCall.ticketId,
      moveType: activeCall.moveType || 'General Packers & Movers Query',
      sentiment: activeCall.status === 'Connected' ? 'Satisfied' : 'Missed Call',
      aiSummary: `Call handled by ${activeCall.agentName}. Total duration ${formattedDuration}. Keypresses: ${dtmfLog.join(' -> ')}. Notes: ${callNotesInput || 'No manual notes added.'}`,
      notes: callNotesInput || 'Call completed through IVR extension.'
    };

    setCallLogs((prev) => [finishedLog, ...prev]);

    // Free up agent status
    if (activeCall.agentId) {
      setAgents(prev => prev.map(a => a.id === activeCall.agentId ? { ...a, status: 'Available', callsToday: a.callsToday + 1 } : a));
    }

    setActiveCall(null);
    setCallTimer(0);
    setCallNotesInput('');
    setDtmfLog([]);
    setIsMuted(false);
    setIsOnHold(false);

    showToast.success(`Call ended & saved to Call History logs (${formattedDuration})`);
  };

  // Toggle Agent Availability Status
  const handleToggleAgentStatus = (agentId) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const nextStatus = a.status === 'Available' ? 'On Break' : a.status === 'On Break' ? 'Offline' : 'Available';
        showToast.info(`${a.name} status updated to ${nextStatus}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  // Update Agent Extension
  const handleUpdateExtension = (agentId, newExt) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, extension: newExt } : a));
    showToast.success("Extension number updated!");
  };

  // Format Duration helper
  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins}m ${remainderSec < 10 ? '0' : ''}${remainderSec}s`;
  };

  // Filtered Call History Logs
  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch = 
      log.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.callerPhone.includes(searchQuery) ||
      log.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDirection = directionFilter === 'All' || log.direction === directionFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  // Calculate Metrics
  const totalCallsToday = callLogs.length;
  const completedCalls = callLogs.filter(l => l.status === 'Completed').length;
  const missedCalls = callLogs.filter(l => l.status === 'Missed').length;
  const answerRate = totalCallsToday > 0 ? Math.round((completedCalls / totalCallsToday) * 100) : 100;
  const avgDurationSec = callLogs.length > 0 ? Math.round(callLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0) / callLogs.length) : 0;

  return (
    <div className="ivr-page-container">
      {/* Top Banner Header */}
      <div className="ivr-header">
        <div className="ivr-header-title">
          <div className="ivr-icon-badge">
            <Headphones size={24} />
          </div>
          <div>
            <h1>PackYatra IVR & Call Center System</h1>
            <p>Manage callers, assign extensions to created team users, simulate live calls, and save call history logs.</p>
          </div>
        </div>

        {/* Live System Status Pill */}
        <div className="ivr-status-pill">
          <span className="live-dot pulse"></span>
          <span>IVR Auto-Responder Active</span>
          <span className="queue-count">3 Lines Available</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="ivr-tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'callCenter' ? 'active' : ''}`}
          onClick={() => setActiveTab('callCenter')}
        >
          <PhoneCall size={16} /> Live Dialer & Call Center
        </button>
        <button 
          className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          <Users size={16} /> User Extensions ({agents.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} /> Call History & Logs ({callLogs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ivrFlow' ? 'active' : ''}`}
          onClick={() => setActiveTab('ivrFlow')}
        >
          <ListOrdered size={16} /> IVR Workflow Tree
        </button>
      </div>

      {/* =========================================================
          TAB 1: LIVE DIALER & CALL CENTER SIMULATOR
         ========================================================= */}
      {activeTab === 'callCenter' && (
        <div className="call-center-grid">
          {/* Left Column: Interactive Softphone & Call Controller */}
          <div className="softphone-card">
            <div className="card-header-bar">
              <span className="card-title"><Radio size={16} /> Interactive IVR Softphone</span>
              {activeCall && <span className="status-tag live"><Activity size={12} /> Call in Progress</span>}
            </div>

            {/* Simulated Active Call Screen */}
            {activeCall ? (
              <div className="active-call-display">
                <div className="call-avatar-circle pulsing">
                  <PhoneIncoming size={32} />
                </div>
                <div className="caller-main-name">{activeCall.callerName}</div>
                <div className="caller-main-phone">{activeCall.callerPhone}</div>
                <div className="call-timer-badge">
                  <Clock size={14} /> {formatSeconds(callTimer)}
                </div>

                <div className="ivr-step-box">
                  <div className="step-label">Current IVR Path:</div>
                  <div className="step-value">{activeCall.ivrStep}</div>
                </div>

                {/* Live DTMF History Sequence */}
                <div className="dtmf-history-pills">
                  {dtmfLog.map((logItem, idx) => (
                    <span key={idx} className="dtmf-chip">{logItem}</span>
                  ))}
                </div>

                {/* Call Controls Bar */}
                <div className="softphone-action-buttons">
                  <button 
                    className={`btn-control ${isMuted ? 'active' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute" : "Mute Call"}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>

                  <button 
                    className={`btn-control ${isOnHold ? 'active' : ''}`}
                    onClick={() => setIsOnHold(!isOnHold)}
                    title={isOnHold ? "Resume Call" : "Put on Hold"}
                  >
                    <Pause size={18} />
                    <span>{isOnHold ? 'On Hold' : 'Hold'}</span>
                  </button>

                  {activeCall.status === 'IVR Menu' && (
                    <button 
                      className="btn-control primary"
                      onClick={handleConnectCall}
                    >
                      <UserCheck size={18} />
                      <span>Connect to Agent</span>
                    </button>
                  )}

                  <button 
                    className="btn-control danger"
                    onClick={handleEndCall}
                  >
                    <PhoneOff size={18} />
                    <span>End Call</span>
                  </button>
                </div>

                {/* Call Notes Input */}
                <div className="call-notes-area">
                  <label>Add Live Call Notes:</label>
                  <textarea 
                    placeholder="Type dispatch updates, customer requirements, or transit details..."
                    value={callNotesInput}
                    onChange={(e) => setCallNotesInput(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              /* Softphone Launcher Controls when no active call */
              <div className="softphone-launcher-form">
                <p className="form-subtitle">Simulate an incoming or outbound call to test IVR auto-responder routing and log history.</p>

                <div className="form-group">
                  <label>Customer / Caller Name:</label>
                  <input 
                    type="text" 
                    value={customCallerName}
                    onChange={(e) => setCustomCallerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="form-group">
                  <label>Customer Phone Number:</label>
                  <input 
                    type="text" 
                    value={customCallerPhone}
                    onChange={(e) => setCustomCallerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label>Link to Ticket / Booking ID:</label>
                  <select 
                    value={selectedTicketId}
                    onChange={(e) => handleTicketSelectChange(e.target.value)}
                  >
                    <option value="">-- Direct Caller / No Linked Ticket --</option>
                    {tickets.map((t, idx) => {
                      const tCode = `#${t.bookingID || t.ticketNumber || t.id}`;
                      return (
                        <option key={idx} value={tCode}>
                          Ticket {tCode} - {t.customerName || t.fromLocation || 'Relocation'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button 
                  className="btn-launch-call"
                  onClick={handleStartInboundCall}
                >
                  <PhoneIncoming size={18} /> Start Simulated Inbound Call
                </button>
              </div>
            )}

            {/* DTMF Keypad Grid */}
            <div className="dtmf-keypad-section">
              <div className="keypad-title">Interactive IVR Keypad (DTMF Tone Pad)</div>
              <div className="keypad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button 
                    key={key} 
                    className="keypad-btn"
                    onClick={() => handleDtmfPress(key)}
                    disabled={!activeCall}
                  >
                    <span className="key-number">{key}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Agent Queue & Recommended Routing */}
          <div className="agent-routing-column">
            {/* Quick Metrics Bar */}
            <div className="mini-metrics-grid">
              <div className="metric-box">
                <div className="m-label">Total Calls Today</div>
                <div className="m-value">{totalCallsToday}</div>
              </div>
              <div className="metric-box">
                <div className="m-label">Answer Rate</div>
                <div className="m-value success">{answerRate}%</div>
              </div>
              <div className="metric-box">
                <div className="m-label">Avg Call Duration</div>
                <div className="m-value">{formatSeconds(avgDurationSec)}</div>
              </div>
              <div className="metric-box">
                <div className="m-label">Missed Calls</div>
                <div className="m-value danger">{missedCalls}</div>
              </div>
            </div>

            {/* User Agents Extension List for Quick Assignment */}
            <div className="agents-live-panel">
              <div className="panel-header-title">
                <h3><Users size={16} /> User Call Extension Queue</h3>
                <span className="count-tag">{agents.filter(a => a.status === 'Available').length} Available</span>
              </div>

              <div className="agents-cards-list">
                {agents.map((agent) => (
                  <div key={agent.id} className={`agent-row-card ${agent.status.toLowerCase().replace(' ', '-')}`}>
                    <div className="agent-avatar">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="agent-info">
                      <div className="agent-name-line">
                        <span className="name">{agent.name}</span>
                        <span className="ext-badge">Ext {agent.extension}</span>
                      </div>
                      <div className="agent-sub">{agent.role} • {agent.department}</div>
                    </div>

                    <div className="agent-status-col">
                      <span className={`status-badge ${agent.status.toLowerCase().replace(' ', '-')}`}>
                        {agent.status}
                      </span>
                      <button 
                        className="btn-status-toggle"
                        onClick={() => handleToggleAgentStatus(agent.id)}
                        title="Change user availability status"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: USER EXTENSIONS & AGENT MANAGEMENT
         ========================================================= */}
      {activeTab === 'agents' && (
        <div className="agents-management-section">
          <div className="section-toolbar">
            <h2>Created App Users & IVR Extensions</h2>
            <p>Every created user, admin, and supervisor is automatically assigned an IVR extension to handle incoming customer dispatches.</p>
          </div>

          <div className="agents-table-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User / Agent Name</th>
                  <th>App Role</th>
                  <th>IVR Extension</th>
                  <th>Department Group</th>
                  <th>Call Status</th>
                  <th>Calls Today</th>
                  <th>Avg Handle Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No active users or extensions configured. Create supervisors or admin users to assign IVR extensions.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="avatar-circle-sm">
                            {(agent.name || 'User').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="user-name-bold">{agent.name}</div>
                            <div className="user-email-sub">{agent.id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="role-chip">{agent.role}</span></td>
                      <td>
                        <div className="ext-input-group">
                          <span className="ext-prefix">Ext</span>
                          <input 
                            type="text" 
                            className="ext-input"
                            value={agent.extension}
                            onChange={(e) => handleUpdateExtension(agent.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td>{agent.department}</td>
                      <td>
                        <span className={`status-badge ${agent.status.toLowerCase().replace(' ', '-')}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td><strong>{agent.callsToday}</strong> calls</td>
                      <td>{agent.avgDuration}</td>
                      <td>
                        <button 
                          className="btn-action-sm"
                          onClick={() => handleToggleAgentStatus(agent.id)}
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: CALL HISTORY & LOGS
         ========================================================= */}
      {activeTab === 'logs' && (
        <div className="call-logs-section">
          {/* Filters Bar */}
          <div className="logs-filter-bar">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search by caller, phone, ticket # or supervisor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <Filter size={15} />
              <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
                <option value="All">All Directions</option>
                <option value="Inbound">Inbound Calls</option>
                <option value="Outbound">Outbound Calls</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Missed">Missed</option>
              </select>

              {onNavigate && (
                <button 
                  className="btn-view-details" 
                  style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb', padding: '8px 14px' }}
                  onClick={() => onNavigate('ivrCallHistory')}
                >
                  <ArrowUpRight size={14} /> Full History View
                </button>
              )}
            </div>
          </div>

          {/* Logs Table */}
          <div className="logs-table-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Caller Info</th>
                  <th>Direction</th>
                  <th>Assigned User / Extension</th>
                  <th>Ticket / Booking</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                  <th>Status & Sentiment</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No call history records found. Simulate a call using the IVR Softphone to log call history.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="log-row">
                      <td><strong className="code-text">{log.id}</strong></td>
                      <td>
                        <div>
                          <div className="caller-name">{log.callerName}</div>
                          <div className="caller-phone">{log.callerPhone}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`dir-badge ${log.direction.toLowerCase()}`}>
                          {log.direction === 'Inbound' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                          {log.direction}
                        </span>
                      </td>
                      <td>
                        <div className="agent-text">{log.agentName}</div>
                        <div className="ext-sub">{log.extension}</div>
                      </td>
                      <td>
                        {log.ticketId ? (
                          <span className="ticket-badge">{log.ticketId}</span>
                        ) : (
                          <span className="none-text">-</span>
                        )}
                      </td>
                      <td>{formatSeconds(log.durationSeconds)}</td>
                      <td>{log.timestamp}</td>
                      <td>
                        <span className={`status-pill ${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view-details"
                          onClick={() => setSelectedLog(log)}
                        >
                          <FileText size={14} /> View Log
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: IVR WORKFLOW TREE CONFIG
         ========================================================= */}
      {activeTab === 'ivrFlow' && (
        <div className="ivr-flow-section">
          <div className="flow-intro">
            <h2>PackYatra IVR Automated Voice Tree</h2>
            <p>Interactive Voice Response menu workflow for incoming customer phone callers.</p>
          </div>

          <div className="ivr-tree-container">
            {/* Greeting Node */}
            <div className="tree-node root">
              <div className="node-icon"><PhoneCall size={20} /></div>
              <div className="node-content">
                <div className="node-title">Inbound Caller Entry Point</div>
                <div className="node-desc">"Welcome to PackYatra Packers & Movers operational dispatch helpline..."</div>
              </div>
            </div>

            <div className="tree-branches-grid">
              <div className="tree-card">
                <div className="dtmf-number">Press 1</div>
                <div className="dtmf-title">Instant Relocation Quote</div>
                <div className="dtmf-desc">Calculates moving price estimate based on BHK size & transit distance.</div>
                <div className="dtmf-target">Routes to: Auto-Quote Calculator</div>
              </div>

              <div className="tree-card">
                <div className="dtmf-number">Press 2</div>
                <div className="dtmf-title">Order & Consignment Tracking</div>
                <div className="dtmf-desc">Prompt user to input 4-digit booking ticket ID for GPS vehicle status.</div>
                <div className="dtmf-target">Routes to: Tracking Engine</div>
              </div>

              <div className="tree-card">
                <div className="dtmf-number">Press 3</div>
                <div className="dtmf-title">Talk to Field Supervisor</div>
                <div className="dtmf-desc">Transfers call directly to assigned supervisor extension (Ext 101, 102).</div>
                <div className="dtmf-target">Routes to: Supervisor User Queue</div>
              </div>

              <div className="tree-card">
                <div className="dtmf-number">Press 4</div>
                <div className="dtmf-title">Fleet Truck & Driver Info</div>
                <div className="dtmf-desc">Provides truck registration number and assigned driver contact details.</div>
                <div className="dtmf-target">Routes to: Fleet Management</div>
              </div>

              <div className="tree-card priority">
                <div className="dtmf-number alert">Press 0</div>
                <div className="dtmf-title">Emergency Escalation</div>
                <div className="dtmf-desc">Priority transfer to Admin Dispatch Manager for urgent assistance.</div>
                <div className="dtmf-target">Routes to: Admin Ext 100</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CALL DETAILS MODAL / DRAWER
         ========================================================= */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-group">
                <FileText size={18} />
                <div>
                  <h3>Call History Record: {selectedLog.id}</h3>
                  <p>{selectedLog.timestamp}</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Caller & Agent Overview */}
              <div className="detail-cards-grid">
                <div className="detail-card">
                  <div className="card-label">Caller Information</div>
                  <div className="card-val-bold">{selectedLog.callerName}</div>
                  <div className="card-sub">{selectedLog.callerPhone}</div>
                  <div className="card-sub">Type: {selectedLog.moveType}</div>
                </div>

                <div className="detail-card">
                  <div className="card-label">Assigned Representative</div>
                  <div className="card-val-bold">{selectedLog.agentName}</div>
                  <div className="card-sub">{selectedLog.extension}</div>
                  <div className="card-sub">Duration: {formatSeconds(selectedLog.durationSeconds)}</div>
                </div>
              </div>

              {/* Simulated Audio Player */}
              <div className="audio-player-card">
                <div className="player-label">Recorded Audio Playback</div>
                <div className="player-controls-row">
                  <button 
                    className="btn-play-pause"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  >
                    {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <div className="audio-progress-bar">
                    <div className="audio-fill" style={{ width: `${audioProgress}%` }}></div>
                  </div>

                  <span className="audio-time">
                    {Math.floor((selectedLog.durationSeconds * (audioProgress / 100)) / 60)}:
                    {Math.floor((selectedLog.durationSeconds * (audioProgress / 100)) % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* IVR Keypress Sequence */}
              <div className="ivr-path-section">
                <div className="path-label">IVR Keypress Sequence:</div>
                <div className="path-tags">
                  {selectedLog.ivrPath.map((step, idx) => (
                    <span key={idx} className="path-step-chip">
                      {step} {idx < selectedLog.ivrPath.length - 1 && <ChevronRight size={12} />}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Call Summary */}
              <div className="ai-summary-box">
                <div className="ai-title"><Sparkles size={14} /> Automated Call Summary</div>
                <p>{selectedLog.aiSummary}</p>
              </div>

              {/* Saved Notes */}
              <div className="notes-box">
                <div className="notes-title">Operator Follow-up Notes:</div>
                <p>{selectedLog.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
