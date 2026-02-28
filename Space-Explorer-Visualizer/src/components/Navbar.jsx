import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon, Rocket, Navigation, Info, LogOut, User } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar = () => {
    const { theme, toggleTheme, playAudio } = useContext(ThemeContext);
    const navigate = useNavigate();
    const userName = localStorage.getItem('spaceUserName');

    const handleNavClick = () => {
        playAudio('click');
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

    return (
        <nav className="glass-panel" style={styles.nav}>
            <div style={styles.logo}>
                <img src="/logo.png" alt="Logo" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
                <span style={styles.logoText}>Space Explorer</span>
            </div>

            <div style={styles.links}>
                <NavLink
                    to="/home"
                    style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    onClick={handleNavClick}
                >
                    <Navigation size={18} /> Missions
                </NavLink>
                <NavLink
                    to="/visualizer"
                    style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    onClick={handleNavClick}
                >
                    <Info size={18} /> Visualizer
                </NavLink>
            </div>

            <div style={styles.rightSection}>
                {userName && (
                    <div style={styles.userInfo}>
                        <User size={16} color="var(--accent-primary)" />
                        <span>{userName}</span>
                    </div>
                )}

                <button onClick={toggleTheme} style={styles.themeToggle} title={`Switch to ${theme === 'night' ? 'Day' : 'Night'} Mode`}>
                    {theme === 'night' ? <Sun color="#FFD700" size={20} /> : <Moon color="#102A43" size={20} />}
                </button>

                <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                    <LogOut size={20} color="var(--error-color)" />
                </button>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        margin: '20px',
        position: 'sticky',
        top: '20px',
        zIndex: 1000,
        borderRadius: '30px'
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: 'var(--accent-primary)',
        textShadow: 'var(--glow-shadow)'
    },
    logoText: {
        display: 'none',
        '@media (minWidth: 768px)': {
            display: 'inline'
        }
    },
    links: {
        display: 'flex',
        gap: '20px'
    },
    link: {
        textDecoration: 'none',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'color 0.2s',
        padding: '8px 16px',
        borderRadius: '20px'
    },
    activeLink: {
        textDecoration: 'none',
        color: 'var(--bg-primary)',
        backgroundColor: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '8px 16px',
        borderRadius: '20px',
        boxShadow: 'var(--glow-shadow)'
    },
    themeToggle: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '50%',
        transition: 'transform 0.3s'
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        padding: '5px 10px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '15px',
        border: '1px solid var(--glass-border)'
    },
    logoutBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        transition: 'transform 0.2s',
        opacity: 0.8
    }
};

export default Navbar;
