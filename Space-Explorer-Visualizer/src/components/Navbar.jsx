import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon, Navigation, Info, LogOut, User, Menu, X } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useBreakpoint } from '../hooks/useBreakpoint';

const Navbar = () => {
    const { theme, toggleTheme, playAudio } = useContext(ThemeContext);
    const navigate = useNavigate();
    const { isMobile } = useBreakpoint();
    const userName = localStorage.getItem('spaceUserName');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleNavClick = () => {
        playAudio('click');
        setMenuOpen(false);
    };

    const handleLogout = async () => {
        playAudio('click');
        try {
            await signOut(auth);
            localStorage.removeItem('spaceToken');
            localStorage.removeItem('spaceUserName');
            navigate('/');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    // Close menu on Escape key
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Close menu on click outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [menuOpen]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen, isMobile]);

    return (
        <nav className="glass-panel" style={styles.nav} ref={menuRef}>
            <div style={styles.logo}>
                <img src="/logo.png" alt="Space Explorer Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                {!isMobile && <span style={styles.logoText}>Space Explorer</span>}
            </div>

            {/* Desktop Links */}
            {!isMobile && (
                <div style={styles.links}>
                    <NavLink
                        to="/home"
                        style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                        onClick={handleNavClick}
                    >
                        <Navigation size={16} /> Missions
                    </NavLink>
                    <NavLink
                        to="/visualizer"
                        style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                        onClick={handleNavClick}
                    >
                        <Info size={16} /> Visualizer
                    </NavLink>
                </div>
            )}

            <div style={styles.rightSection}>
                {userName && !isMobile && (
                    <div style={styles.userInfo}>
                        <User size={14} color="var(--accent-primary)" />
                        <span>{userName}</span>
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    style={styles.iconBtn}
                    title={`Switch to ${theme === 'night' ? 'Day' : 'Night'} Mode`}
                    aria-label={`Switch to ${theme === 'night' ? 'Day' : 'Night'} mode`}
                >
                    {theme === 'night' ? <Sun color="#FFD700" size={20} /> : <Moon color="#102A43" size={20} />}
                </button>

                {!isMobile && (
                    <button onClick={handleLogout} style={styles.iconBtn} title="Logout" aria-label="Logout">
                        <LogOut size={20} color="var(--error-color)" />
                    </button>
                )}

                {/* Mobile hamburger */}
                {isMobile && (
                    <button
                        onClick={() => { setMenuOpen(!menuOpen); playAudio('click'); }}
                        style={styles.iconBtn}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={22} color="var(--accent-primary)" /> : <Menu size={22} color="var(--accent-primary)" />}
                    </button>
                )}
            </div>

            {/* Mobile Slide-Out Drawer */}
            {isMobile && menuOpen && (
                <>
                    <div style={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
                    <div style={styles.drawer} role="dialog" aria-modal="true" aria-label="Navigation menu">
                        {userName && (
                            <div style={{ ...styles.userInfo, marginBottom: '16px', justifyContent: 'center' }}>
                                <User size={14} color="var(--accent-primary)" />
                                <span>{userName}</span>
                            </div>
                        )}
                        <NavLink
                            to="/home"
                            style={({ isActive }) => isActive ? { ...styles.drawerLink, ...styles.drawerLinkActive } : styles.drawerLink}
                            onClick={handleNavClick}
                        >
                            <Navigation size={18} /> Missions
                        </NavLink>
                        <NavLink
                            to="/visualizer"
                            style={({ isActive }) => isActive ? { ...styles.drawerLink, ...styles.drawerLinkActive } : styles.drawerLink}
                            onClick={handleNavClick}
                        >
                            <Info size={18} /> Visualizer
                        </NavLink>
                        <button onClick={handleLogout} style={styles.drawerLogout}>
                            <LogOut size={18} color="var(--error-color)" /> Logout
                        </button>
                    </div>
                </>
            )}
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(10px, 2vw, 15px) clamp(14px, 3vw, 30px)',
        margin: 'clamp(8px, 2vw, 20px)',
        position: 'sticky',
        top: 'clamp(8px, 2vw, 20px)',
        zIndex: 1000,
        borderRadius: '24px',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
        fontWeight: 'bold',
        color: 'var(--accent-primary)',
        textShadow: 'var(--glow-shadow)',
    },
    logoText: {
        display: 'inline',
    },
    links: {
        display: 'flex',
        gap: '12px',
    },
    link: {
        textDecoration: 'none',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'color 0.2s, background 0.2s',
        padding: '8px 14px',
        borderRadius: '20px',
    },
    activeLink: {
        textDecoration: 'none',
        color: 'var(--bg-primary)',
        backgroundColor: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        padding: '8px 14px',
        borderRadius: '20px',
        boxShadow: 'var(--glow-shadow)',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '50%',
        transition: 'transform 0.2s, background 0.2s',
        touchAction: 'manipulation',
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        padding: '5px 10px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '15px',
        border: '1px solid var(--glass-border)',
    },
    // Mobile Drawer styles
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 998,
    },
    drawer: {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '260px',
        background: 'var(--bg-primary)',
        zIndex: 999,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.25s ease',
        paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
    },
    drawerLink: {
        textDecoration: 'none',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1rem',
        padding: '14px 16px',
        borderRadius: '12px',
        transition: 'background 0.2s',
        fontWeight: '500',
    },
    drawerLinkActive: {
        color: 'var(--bg-primary)',
        backgroundColor: 'var(--accent-primary)',
        fontWeight: 'bold',
    },
    drawerLogout: {
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1rem',
        padding: '14px 16px',
        borderRadius: '12px',
        background: 'none',
        border: '1px solid var(--error-color)',
        color: 'var(--error-color)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
    },
};

export default Navbar;
