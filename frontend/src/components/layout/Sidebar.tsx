import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  User as UserIcon,
  LogOut,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/farms',
      label: 'My Farms',
      icon: Sprout,
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: UserIcon,
    },
  ];

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img
            src="/lims_logo.png"
            alt="LIMS Logo"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              borderRadius: '6px',
            }}
          />
          <div style={{ flex: 1 }}>
            <div className="sidebar-brand-title">LIMS Farmer Portal</div>
            <span className="sidebar-brand-sub">Farm & Crop Monitoring</span>
          </div>

          {mobileOpen && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-link-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="nav-link-item btn-nav-logout"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '0.5rem',
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="farmer-mini-profile">
            <div className="farmer-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="farmer-meta">
              <div className="farmer-name" title={user?.username || 'Farmer'}>
                {user?.username || 'Farmer'}
              </div>
              <span className="farmer-role">Registered Farmer</span>
            </div>
          </div>
          <button
            className="btn-sidebar-logout"
            onClick={handleLogout}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

