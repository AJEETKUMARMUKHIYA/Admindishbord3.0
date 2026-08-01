import { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/MainContent';
import { showToast } from './components/ToastNotification';
import axiosClient from './AxiosClient';
import config from './config';
import './styles/global.css';
import { Toaster } from 'sonner';
import { Menu } from 'lucide-react';

function App() {
  // Initialize theme and auto-restore login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('token') || localStorage.getItem('userId'));
  });
  const [userData, setUserData] = useState(() => {
    const userId = localStorage.getItem('userId');
    const firstName = localStorage.getItem('firstName') || 'Admin';
    const lastName = localStorage.getItem('lastName') || 'User';
    const email = localStorage.getItem('email') || 'admin@packyatra.in';
    const roleId = Number(localStorage.getItem('roleId')) || 1;
    return userId ? { userId, firstName, lastName, email, roleId } : null;
  });

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);

  const [supervisors, setSupervisors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [stats, setStats] = useState({
    activeTickets: 0,
    inProgress: 0,
    closedThisMonth: 0,
    cancelledThisMonth: 0,
    newUsersWithoutToken: 0,
    activeSupervisors: 0,
    totalSupervisors: 0
  });
  const [loading, setLoading] = useState(false);

  // Initialize theme on app mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'vibrant-ocean';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  // Responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load dashboard after login
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [ticketsRes, supervisorsRes, adminUsersRes] = await Promise.all([
        fetchTickets(),
        fetchSupervisors(),
        fetchAdminUsers()
      ]);

      setTickets(ticketsRes);
      setSupervisors(supervisorsRes);
      setAdminUsers(adminUsersRes);
      calculateStats(ticketsRes, supervisorsRes);

      showToast.success('Dashboard data loaded successfully!');
    } catch (error) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

    return {
      ...item,
      ticketID: item.ticketID || bId,
      ticketNo: tNo,
      bookingID: bId,
      quotationNumber: item.quotationNumber || `QUO-${bId}`,
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

  const fetchTickets = async () => {
    try {
      // Primary: query /Dashboard/recent-bookings
      const res = await axiosClient.get(config.urls.dashboardRecentBookings);
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (items && items.length > 0) {
        return items.map(mapBookingToTicket);
      }
      
      // Fallback: /Booking/Tickets
      const resFallback = await axiosClient.get(config.urls.tickets);
      const itemsFallback = resFallback.data?.data || (Array.isArray(resFallback.data) ? resFallback.data : null);
      if (itemsFallback && itemsFallback.length > 0) {
        return itemsFallback.map(mapBookingToTicket);
      }

      return [];
    } catch {
      return [];
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await axiosClient.get(config.urls.supervisors);
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (items) return items;
      return [];
    } catch {
      return [];
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await axiosClient.get(config.urls.adminUsers);
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (items) return items;
      return [];
    } catch {
      return [];
    }
  };

  const calculateStats = (ticketsData, supervisorsData) => {
    setStats({
      activeTickets: ticketsData.filter(t => t.status === 'New').length,
      inProgress: ticketsData.filter(t => t.status === 'In Progress').length,
      closedThisMonth: ticketsData.filter(t => t.status === 'Closed').length,
      cancelledThisMonth: ticketsData.filter(t => t.status === 'Cancelled').length,
      newUsersWithoutToken: 0,
      activeSupervisors: supervisorsData.filter(s => s.active).length,
      totalSupervisors: supervisorsData.length
    });
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUserData(user);
    showToast.success(`Welcome back, ${user.firstName}!`);
  };

  

  // ✅ FIXED: Logout popup shows only once
  const handleLogout = () => {
    showToast.warning('Are you sure you want to logout?', {
      duration: 0,
      action: {
        label: 'Yes, Logout',
        onClick: () => {
          localStorage.clear();
          setIsLoggedIn(false);
          setUserData(null);
          setTickets([]);
          setSupervisors([]);
          setAdminUsers([]);
          showToast.info('Logged out successfully');
        }
      },
      cancel: {
        label: 'Cancel'
      }
    });
  };

  const toggleSidebar = () => setSidebarVisible(v => !v);

  const showPage = (page) => {
    setCurrentPage(page);
    if (isMobile) setSidebarVisible(false);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      {/* ✅ SINGLE toast container */}
      <Toaster position="top-right" richColors />

      <div id="adminPanel">
        <button className="mobile-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>

        <Sidebar
          visible={sidebarVisible}
          currentPage={currentPage}
          onNavigate={showPage}
          onLogout={handleLogout}
          userData={userData}
        />

        <MainContent
          sidebarVisible={sidebarVisible}
          currentPage={currentPage}
          onNavigate={showPage}
          supervisors={supervisors}
          tickets={tickets}
          adminUsers={adminUsers}
          stats={stats}
          loading={loading}
          onRefreshData={fetchDashboardData}
          userData={userData}
        />
      </div>
    </>
  );
}

export default App;
