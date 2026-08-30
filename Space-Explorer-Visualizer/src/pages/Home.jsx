import React from 'react';
import Carousel from '../components/Carousel';
import { ThemeContext } from '../context/ThemeContext';

const Home = () => {
    const { playAudio } = React.useContext(ThemeContext);

    return (
        <div style={styles.container} className="app-container">
            <div style={styles.header}>
                <h1 style={styles.title}>STAR-COMMAND DATABASE</h1>
                <p style={styles.subtitle}>
                    Welcome to the Galactic Navigational Array Visualizer.<br />
                    Select a search algorithm protocol below to execute a deep space scan.
                </p>
            </div>

            <Carousel playAudio={playAudio} />

            <div className="glass-panel" style={styles.infoBox}>
                <h3 style={{ marginBottom: '10px' }}>SYSTEM STATUS: ONLINE</h3>
                <p className="break-text">
                    <strong>Audio:</strong> Enabled. Click sounds synthesized for space environment.<br />
                    <strong>Theme:</strong> Adaptive. Use the toggle in top right for Solar (Day) or Nebula (Night) mode. Shortcut: <kbd style={styles.kbd}>Alt+T</kbd><br />
                    <strong>AI Assistance:</strong> Star-Command Chatbot is available in the bottom right corner for inquiries.
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: 'clamp(12px, 3vw, 20px)',
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 100px)',
    },
    header: {
        textAlign: 'center',
        margin: 'clamp(20px, 5vw, 40px) 0',
    },
    title: {
        fontSize: 'clamp(1.4rem, 5vw, 3rem)',
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
        opacity: 0.85,
        lineHeight: '1.6',
    },
    infoBox: {
        marginTop: 'clamp(24px, 5vw, 50px)',
        borderLeft: '4px solid var(--accent-secondary)',
    },
    kbd: {
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: '0.8rem',
        borderRadius: '4px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(0,0,0,0.2)',
        fontFamily: 'var(--font-body)',
    },
};

export default Home;
