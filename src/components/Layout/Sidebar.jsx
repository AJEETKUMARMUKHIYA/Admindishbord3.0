import './Sidebar.css';
import { useState, useEffect } from 'react';
import PackYatraLogo from '../PackYatraLogo';
import { 
  Home, 
  Truck, 
  Users, 
  UserSquare2, 
  UserCheck, 
  Ticket, 
  PlusCircle,
  FolderEdit, 
  BarChart3, 
  Settings as SettingsIcon, 
  Shield, 
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';


const Sidebar = ({
  visible,
  currentPage,
  onNavigate,
  onLogout,
  userData
}) => {
  const roleId = userData?.roleId;
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('packyatra_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'obsidian-dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('packyatra_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // 🎯 Role-based access mapping
  const roleAccess = {
    1: ['dashboard', 'vehicle', 'users', 'adminUsers', 'supervisor', 'tickets', 'bookingForm', 'manageUserPage', 'reports', 'settings'], // Admin
    2: ['dashboard', 'tickets', 'bookingForm', 'reports'] // Supervisor
  };

  // 📋 Navigation items with submenu support
  const navItems = [
    { id: 'dashboard', icon: Home, text: 'Dashboard' },
    { id: 'vehicle', icon: Truck, text: 'Vehicles' },
    { 
      id: 'users', 
      icon: Users, 
      text: 'Users',
      submenu: [
        { id: 'adminUsers', icon: UserSquare2, text: 'Admin Users' },
        { id: 'supervisor', icon: UserCheck, text: 'Supervisor' } 
      ] 
    },
    { id: 'tickets', icon: Ticket, text: 'Tickets' },
    { id: 'bookingForm', icon: PlusCircle, text: 'Book Ticket' },
    { id: 'manageUserPage', icon: FolderEdit, text: 'Ticket Management' },
    { id: 'reports', icon: BarChart3, text: 'Reports' },
    { id: 'settings', icon: SettingsIcon, text: 'Settings' }
  ];

  // 🔐 Filter menu based on role
  const filteredNavItems = navItems.filter(item => {
    const isItemAccessible = roleAccess[roleId]?.includes(item.id);
    
    // If item has submenu, filter submenu items as well
    if (item.submenu) {
      item.submenu = item.submenu.filter(subitem =>
        roleAccess[roleId]?.includes(subitem.id)
      );
    }
    
    return isItemAccessible;
  });

  const sidebarClass = visible ? 'sidebar show' : 'sidebar';

  const initials = `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  // 🎯 Toggle submenu expansion
  const toggleSubmenu = (itemId) => {
    setExpandedMenu(expandedMenu === itemId ? null : itemId);
  };

  // 🎯 Handle menu item click
  const handleMenuClick = (itemId) => {
    onNavigate(itemId);
  };

  return (
    <div className={sidebarClass} id="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <PackYatraLogo variant="dark" size="small" />
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Menu</div>

        {/* 🔐 Role Based Menu */}
        {filteredNavItems.map(item => {
          const IconComponent = item.icon;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = expandedMenu === item.id;
          const isCurrentActive = currentPage === item.id || (hasSubmenu && item.submenu.some(sub => sub.id === currentPage));

          return (
            <div key={item.id} className="nav-item-wrapper">
              <div className="nav-item-container">
                <a
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleSubmenu(item.id);
                    } else {
                      handleMenuClick(item.id);
                    }
                  }}
                  className={`nav-item ${isCurrentActive ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <IconComponent size={18} className="nav-icon-lucide" />
                  <span className="nav-text">{item.text}</span>
                  
                  {/* Dropdown arrow for items with submenu */}
                  {hasSubmenu && (
                    <ChevronDown
                      size={14}
                      className={`submenu-icon ${isSubmenuOpen ? 'expanded' : ''}`}
                    />
                  )}
                </a>
              </div>

              {/* Submenu Items */}
              {hasSubmenu && (
                <div className={`submenu ${isSubmenuOpen ? 'show' : ''}`}>
                  {item.submenu.map(subitem => {
                    const SubIconComponent = subitem.icon;
                    const isSubActive = currentPage === subitem.id;
                    return (
                      <a
                        key={subitem.id}
                        onClick={() => handleMenuClick(subitem.id)}
                        className={`submenu-item ${isSubActive ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <SubIconComponent size={14} className="nav-icon-lucide sub-icon" />
                        <span className="nav-text">{subitem.text}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Night Shift Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Toggle Night-Shift Mode"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDarkMode ? <Moon size={15} style={{ color: '#60a5fa' }} /> : <Sun size={15} style={{ color: '#f59e0b' }} />}
            {isDarkMode ? 'Night Shift Mode' : 'Day Shift Mode'}
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isDarkMode ? '#2563eb' : 'rgba(255, 255, 255, 0.2)',
            fontWeight: 700
          }}>
            {isDarkMode ? 'ON' : 'OFF'}
          </span>
        </button>

        <div className="footer-profile-wrapper">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              {initials}
            </div>
          </div>
          <div className="profile-details">
            <p className="profile-name">
              {userData?.firstName} {userData?.lastName}
            </p>
            <p className="profile-role">
              {roleId === 1 ? 'Administrator' : 'Supervisor'}
            </p>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;