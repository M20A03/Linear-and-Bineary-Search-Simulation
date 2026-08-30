import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const missions = [
    {
        title: "Mission: LINEAR SEARCH",
        description: "Scan every sector sequentially. A reliable method for unmapped, chaotic regions of space.",
        timeComplexity: "O(n)",
        color: "var(--accent-primary)",
        path: "/visualizer?algo=linear"
    },
    {
        title: "Mission: BINARY SEARCH",
        description: "Leap through hyper-space! Requires a strictly ordered star-map. Halves the search area every jump.",
        timeComplexity: "O(log n)",
        color: "var(--accent-secondary)",
        path: "/visualizer?algo=binary"
    }
];

const Carousel = ({ playAudio }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    const handleNext = () => {
        playAudio('click');
        setCurrentIndex((prev) => (prev + 1) % missions.length);
    };

    const handlePrev = () => {
        playAudio('click');
        setCurrentIndex((prev) => (prev - 1 + missions.length) % missions.length);
    };

    const currentMission = missions[currentIndex];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % missions.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="glass-panel" style={styles.carouselContainer}>
            <button onClick={handlePrev} style={styles.navButton}><ChevronLeft size={32} color={currentMission.color} /></button>

            <div style={styles.slideContent}>
                <h2 style={{ color: currentMission.color, textShadow: `0 0 10px ${currentMission.color}` }}>
                    {currentMission.title}
                </h2>
                <p style={{ margin: '20px 0', fontSize: '1.2rem', minHeight: '80px' }}>
                    {currentMission.description}
                </p>
                <div style={styles.stats}>
                    <strong>Time Complexity:</strong> <span style={{ color: currentMission.color }}>{currentMission.timeComplexity}</span>
                </div>
                <button
                    className="btn-primary"
                    style={{ ...styles.launchButton, borderColor: currentMission.color, color: currentMission.color }}
                    onClick={() => { playAudio('success'); navigate(currentMission.path); }}
                >
                    <Play size={18} /> LAUNCH MISSION
                </button>
            </div>

            <button onClick={handleNext} style={styles.navButton}><ChevronRight size={32} color={currentMission.color} /></button>
        </div>
    );
};

const styles = {
    carouselContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '800px',
        margin: '40px auto',
        minHeight: '350px',
        position: 'relative',
        overflow: 'hidden'
    },
    navButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px',
        transition: 'transform 0.2s',
        zIndex: 2
    },
    slideContent: {
        flex: 1,
        textAlign: 'center',
        padding: '0 20px',
        animation: 'pulse 3s infinite alternate'
    },
    stats: {
        fontFamily: 'var(--font-heading)',
        background: 'rgba(0,0,0,0.3)',
        display: 'inline-block',
        padding: '10px 20px',
        borderRadius: '10px',
        marginBottom: '30px'
    },
    launchButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1.2rem',
        padding: '12px 24px',
        borderRadius: '8px'
    }
};

export default Carousel;
