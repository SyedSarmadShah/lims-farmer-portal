import React from 'react';
import { Menu, PlusCircle, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Dashboard', sub: 'Welcome to your farm management portal' };
      case '/farms':
        return { title: 'My Farms', sub: 'View and manage your registered farms' };
      case '/farms/new':
        return { title: 'Create Farm', sub: 'Register farm name and location' };
      case '/profile':
        return { title: 'My Profile', sub: 'Farmer account details' };
      default:
        if (location.pathname.startsWith('/farms/')) {
          return { title: 'Farm Detail', sub: 'Boundary, Map, Satellite & NDVI' };
        }
        return { title: 'LIMS Farmer Portal', sub: 'Land Information & Management System' };
    }
  };

  const { title, sub } = getPageDetails();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="header-title-wrapper">
          <h2 className="header-title">{title}</h2>
          <span className="header-sub">{sub}</span>
        </div>
      </div>

      <div className="header-right">
        {location.pathname !== '/farms/new' && (
          <Link to="/farms/new" className="btn btn-primary btn-sm btn-header-add">
            <PlusCircle size={16} />
            <span>+ Create Farm</span>
          </Link>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'block',
              }}
            >
              {user?.username}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.phone || user?.email || 'Farmer'}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Log Out"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
