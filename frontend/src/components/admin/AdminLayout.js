'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('Admin');

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
    }
  }, []);

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    closeMenu();
    router.push('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/students', label: 'Students', icon: '👨‍🎓' },
  ];

  return (
    <div className={styles.layout}>
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          isMobileMenuOpen ? styles.mobileOpen : ''
        }`}
      >
        <div className={styles.logo}>
          <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
            <rect width="42" height="42" rx="8" fill="white" />
            <path
              d="M12 18L21 9L30 18L28 20L21 13L14 20Z"
              fill="#0B5ED7"
            />
            <circle cx="21" cy="23" r="3" fill="#0B5ED7" />
            <rect x="14" y="27" width="14" height="2" fill="#0B5ED7" />
          </svg>
          <span>NICET Admin</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeMenu}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ''
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            <span className={styles.navIcon}>🚪</span>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          <div className={styles.userInfo}>
            <span>{adminEmail}</span>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}