import React from 'react';
import Carousel from '../components/Carousel';
import { ThemeContext } from '../context/ThemeContext';

const Home = () => {
    const { playAudio } = React.useContext(ThemeContext);

    return (
        <div style={styles.container}>
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
                <p>
                    <strong>Audio:</strong> Enabled. Click sounds synthesized for space environment.<br />
                    <strong>Theme:</strong> Adaptive. Use the toggle in top right for Solar (Day) or Nebula (Night) mode.<br />
                    <strong>AI Assistance:</strong> Star-Command Chatbot is available in the bottom right corner for inquiries.
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 100px)'
    },
    header: {
        textAlign: 'center',
        margin: '40px 0'
    },
    title: {
        fontSize: '3rem',
        marginBottom: '10px'
    },
    subtitle: {
        fontSize: '1.2rem',
        opacity: 0.8,
        lineHeight: '1.5'
    },
    infoBox: {
        marginTop: '50px',
        borderLeft: '4px solid var(--accent-secondary)'
    }
};

export default Home;
