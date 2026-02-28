import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Play, RotateCcw, Crosshair, Zap, ShieldAlert } from 'lucide-react';
import { database } from '../firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Visualizer = () => {
    const { playAudio } = useContext(ThemeContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialAlgo = queryParams.get('algo') || 'linear';

    const [algo, setAlgo] = useState(initialAlgo);
    const [scenario, setScenario] = useState('space');
    const [array, setArray] = useState([]);
    const [customInput, setCustomInput] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [target, setTarget] = useState('');
    const [speedMultiplier, setSpeedMultiplier] = useState(600); // Decelerated default speed
    const [activeIndices, setActiveIndices] = useState([]);
    const [foundIndex, setFoundIndex] = useState(null);
    const [leftBound, setLeftBound] = useState(null);
    const [rightBound, setRightBound] = useState(null);
    const [discardedIndices, setDiscardedIndices] = useState(new Set());

    // Gamification state
    const MAX_ENERGY = 1000;
    const [energy, setEnergy] = useState(MAX_ENERGY);
    const [steps, setSteps] = useState(0);
    const [isShaking, setIsShaking] = useState(false);

    // Core engine states
    const [isRunningState, setIsRunningState] = useState(false);
    const isRunningRef = React.useRef(false);

    const [isPausedState, setIsPausedState] = useState(false);
    const isPausedRef = React.useRef(false);

    const setIsRunning = (val) => {
        setIsRunningState(val);
        isRunningRef.current = val;
    };

    const setIsPaused = (val) => {
        setIsPausedState(val);
        isPausedRef.current = val;
    };

    const [statusMsg, setStatusMsg] = useState('COMMANDER: Awaiting combat coordinates.');

    useEffect(() => {
        generateArray();
        return () => {
            setIsRunning(false);
            setIsPaused(false);
        }
    }, [algo, scenario]);

    const generateArray = () => {
        if (!isRunningState) playAudio('click');
        const newArr = [];
        setIsCustom(false);
        setCustomInput('');
        if (scenario === 'space') {
            for (let i = 0; i < 24; i++) {
                const val = Math.floor(Math.random() * 100) + 1;
                newArr.push({ display: val, compare: val, height: Math.max(val * 3, 20) });
            }
            if (algo === 'binary') newArr.sort((a, b) => a.compare - b.compare);
            setStatusMsg(`RADAR: New enemy fleet detected. Weapon: ${algo.toUpperCase()} PROTOCOL`);
        } else if (scenario === 'contacts') {
            const names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Ken", "Leo", "Mia", "Neo", "Olivia", "Peggy", "Quinn", "Rupert", "Sybil", "Trent", "Uma", "Victor", "Walter", "Xena", "Yara", "Zoe"];
            const shuffled = names.sort(() => 0.5 - Math.random());
            let selected = shuffled.slice(0, 24);
            if (algo === 'binary') selected.sort();
            selected.forEach(name => {
                newArr.push({ display: name, compare: name.toLowerCase(), height: Math.floor(Math.random() * 150) + 50 });
            });
            setStatusMsg(`DIRECTORY: Loaded contacts. Mode: ${algo.toUpperCase()} SEARCH`);
            setTarget('');
        } else if (scenario === 'attendance') {
            // Unsorted Attendance Sheet (Roll Numbers)
            const rollNumbers = [];
            for (let i = 1; i <= 50; i++) {
                rollNumbers.push(i);
            }
            // Shuffle them so they are unsorted
            const shuffled = rollNumbers.sort(() => 0.5 - Math.random()).slice(0, 24);

            if (algo === 'binary') shuffled.sort((a, b) => a - b);

            shuffled.forEach(val => {
                newArr.push({ display: `Roll ${val}`, compare: val, height: (val / 50) * 200 + 40 });
            });
            setStatusMsg(`ATTENDANCE: Unsorted class list. Mode: ${algo.toUpperCase()} SEARCH`);
            if (algo === 'binary') {
                setStatusMsg(`ATTENDANCE: Teacher sorted the list for ${algo.toUpperCase()} SEARCH!`);
            }
            setTarget('');
        }

        setArray(newArr);
        resetState();
        setEnergy(MAX_ENERGY);
    };

    const handleCustomSubmit = () => {
        if (!customInput.trim()) return;
        const items = customInput.split(',').map(v => v.trim()).filter(v => v);
        if (items.length === 0) return;

        const isNumeric = items.every(v => !isNaN(Number(v)));
        const newArr = [];

        if (isNumeric) {
            let numItems = items.map(Number);
            if (algo === 'binary') numItems.sort((a, b) => a - b);
            const maxVal = Math.max(...numItems, 1);
            numItems.forEach(val => {
                newArr.push({ display: val, compare: val, height: Math.max((val / maxVal) * 200, 20) });
            });
        } else {
            let strItems = items;
            if (algo === 'binary') strItems.sort();
            strItems.forEach(val => {
                newArr.push({ display: val, compare: val.toLowerCase(), height: Math.floor(Math.random() * 150) + 50 });
            });
        }

        setArray(newArr);
        setIsCustom(true);
        resetState();
        setEnergy(MAX_ENERGY);
        setTarget('');
        setStatusMsg(`CUSTOM DATA: Loaded ${newArr.length} items. Mode: ${algo.toUpperCase()} SEARCH`);
        playAudio('click');
    };

    const resetState = () => {
        setActiveIndices([]);
        setFoundIndex(null);
        setLeftBound(null);
        setRightBound(null);
        setDiscardedIndices(new Set());
        setSteps(0);
        setStatusMsg('Awaiting parameters...');
        setIsRunning(false);
        setIsPaused(false);
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const executeSearch = async () => {
        if (isRunningState) return;

        let targetVal = target;
        if (isCustom) {
            // Check if our custom array is numeric
            const firstItemCompare = array[0].compare;
            if (typeof firstItemCompare === 'number') {
                targetVal = parseInt(target);
                if (isNaN(targetVal)) {
                    setStatusMsg('ERROR: Invalid Numeric Target.');
                    playAudio('error'); triggerShake(); return;
                }
            } else {
                targetVal = targetVal.trim().toLowerCase();
                if (!targetVal) {
                    setStatusMsg('ERROR: Invalid String Target.');
                    playAudio('error'); triggerShake(); return;
                }
            }
        } else if (scenario === 'space' || scenario === 'attendance') {
            targetVal = parseInt(target);
            if (isNaN(targetVal)) {
                setStatusMsg('ERROR: Invalid Target Value.');
                playAudio('error');
                triggerShake();
                return;
            }
        } else {
            targetVal = targetVal.trim().toLowerCase();
            if (!targetVal) {
                setStatusMsg('ERROR: Invalid Name.');
                playAudio('error');
                triggerShake();
                return;
            }
        }

        resetState();
        setIsRunning(true);
        setEnergy(MAX_ENERGY);
        playAudio('click');
        triggerShake();

        if (algo === 'linear') {
            await linearSearch(targetVal);
        } else {
            await binarySearch(targetVal);
        }
        setIsRunning(false);
        setIsPaused(false);
    };

    const handlePauseToggle = () => {
        if (!isRunningState) return;
        playAudio('click');
        setIsPaused(!isPausedState);
    };

    const checkPause = async () => {
        while (isPausedRef.current && isRunningRef.current) {
            await sleep(100);
        }
    };

    const depleteEnergy = (amount) => {
        setEnergy(prev => {
            const next = prev - amount;
            return next < 0 ? 0 : next;
        });
    };

    const linearSearch = async (val) => {
        const energyCost = Math.floor(MAX_ENERGY / array.length); // Dynamic cost so it can reach the end
        setSteps(0);
        for (let i = 0; i < array.length; i++) {
            if (!isRunningRef.current) break;
            await checkPause();
            setSteps(prev => prev + 1);
            setActiveIndices([i]);
            setStatusMsg(scenario === 'space' ? `FIRING LASER at Sector [${i}]...` : `SCANNING entry [${i}] for ${val}...`);
            playAudio('click');
            depleteEnergy(energyCost);
            await sleep(speedMultiplier);

            if (array[i].compare === val) {
                setFoundIndex(i);
                setStatusMsg(scenario === 'space' ? `TARGET DESTROYED at coordinate [${i}]!` : `MATCH FOUND at position [${i}]!`);

                const logRef = push(ref(database, 'search_logs'));
                set(logRef, {
                    user: localStorage.getItem('spaceUserName') || 'Anonymous',
                    algorithm: 'linear',
                    target: val,
                    success: true,
                    energyRemaining: energy - energyCost,
                    timestamp: serverTimestamp()
                });

                playAudio('success');
                triggerShake();
                return;
            }
        }
        if (isRunningRef.current) {
            setEnergy(0); // Instantly drop to 0 on failure
            setStatusMsg(scenario === 'space' ? `AMMO DEPLETED. Enemy escaped.` : `SEARCH FAILED. Target missing.`);

            const logRef = push(ref(database, 'search_logs'));
            set(logRef, {
                user: localStorage.getItem('spaceUserName') || 'Anonymous',
                algorithm: 'linear',
                target: val,
                success: false,
                energyRemaining: 0,
                timestamp: serverTimestamp()
            });

            playAudio('error');
        }
    };

    const binarySearch = async (val) => {
        let l = 0;
        let r = array.length - 1;
        setSteps(0);
        setDiscardedIndices(new Set());

        while (l <= r) {
            if (!isRunningRef.current) break;
            await checkPause();
            setSteps(prev => prev + 1);

            // First show the bounds locking
            setLeftBound(l);
            setRightBound(r);
            setStatusMsg(scenario === 'space' ? `ISOLATING SECTORS [${l} ... ${r}]. Preparing Hyper-Jump.` : `NARROWING SEARCH to [${l} ... ${r}].`);
            playAudio('click');
            depleteEnergy(20);
            await sleep(speedMultiplier); // Small pause for visual effect

            const m = Math.floor((l + r) / 2);
            setActiveIndices([m]);
            setStatusMsg(scenario === 'space' ? `HYPER-JUMP to Sector [${m}]! Scanning...` : `CHECKING middle position [${m}]...`);
            playAudio('click');
            triggerShake();

            await sleep(Math.max(speedMultiplier, speedMultiplier === 50 ? 200 : 500));

            const mVal = array[m].compare;
            if (mVal === val) {
                setFoundIndex(m);
                setStatusMsg(scenario === 'space' ? `TARGET DESTROYED at coordinate [${m}]!` : `MATCH FOUND at position [${m}]!`);

                const logRef = push(ref(database, 'search_logs'));
                set(logRef, {
                    user: localStorage.getItem('spaceUserName') || 'Anonymous',
                    algorithm: 'binary',
                    target: val,
                    success: true,
                    energyRemaining: energy - 20,
                    timestamp: serverTimestamp()
                });

                playAudio('success');
                triggerShake();
                return;
            }

            if (mVal < val) {
                setStatusMsg(scenario === 'space' ? `Too high. Discarding below [${m + 1}].` : `Alphabetically/Numerically higher. Moving right.`);
                for (let i = l; i <= m; i++) setDiscardedIndices(prev => new Set(prev).add(i));
                l = m + 1;
            } else {
                setStatusMsg(scenario === 'space' ? `Too low. Discarding above [${m - 1}].` : `Alphabetically/Numerically lower. Moving left.`);
                for (let i = m; i <= r; i++) setDiscardedIndices(prev => new Set(prev).add(i));
                r = m - 1;
            }
            playAudio('click');
            await sleep(speedMultiplier); // Show the discard message
        }
        if (isRunningRef.current) {
            setLeftBound(null);
            setRightBound(null);
            setEnergy(0); // Drop to 0 on failure
            setStatusMsg(scenario === 'space' ? `TRACKING FAILED. Enemy lost.` : `SEARCH FAILED. Target missing.`);

            const logRef = push(ref(database, 'search_logs'));
            set(logRef, {
                user: localStorage.getItem('spaceUserName') || 'Anonymous',
                algorithm: 'binary',
                target: val,
                success: false,
                energyRemaining: 0,
                timestamp: serverTimestamp()
            });

            playAudio('error');
        }
    };

    const getBarColor = (index) => {
        if (foundIndex !== null && foundIndex !== index) return 'rgba(128, 128, 128, 0.2)'; // Dim all others when found
        if (foundIndex === index) return 'var(--success-color)';
        if (activeIndices.includes(index)) return 'var(--search-active)';
        if (discardedIndices.has(index)) return 'rgba(128, 128, 128, 0.2)'; // Dim discarded indices
        if (algo === 'binary' && leftBound !== null && rightBound !== null) {
            if (index < leftBound || index > rightBound) return 'rgba(128, 128, 128, 0.2)'; // dimmed out
        }
        return 'var(--accent-primary)';
    };

    const getBarClass = (index) => {
        if (foundIndex === index) return 'animate-explode';
        if (activeIndices.includes(index)) return 'animate-laser';
        return '';
    };

    return (
        <div style={styles.container} className={isShaking ? 'animate-shake' : ''}>
            <div className="glass-panel" style={styles.controls}>
                {/* Scenario Toggle */}
                <div style={styles.algoToggle}>
                    <button className="btn-primary" style={{ ...styles.algoBtn, padding: '8px', minWidth: '120px', fontSize: '0.9rem', ...(scenario === 'space' ? styles.activeScenario : {}) }} onClick={() => { if (!isRunningState) { setScenario('space'); playAudio('click'); } }} disabled={isRunningState}>🚀 Space</button>
                    <button className="btn-primary" style={{ ...styles.algoBtn, padding: '8px', minWidth: '120px', fontSize: '0.9rem', ...(scenario === 'contacts' ? styles.activeScenario : {}) }} onClick={() => { if (!isRunningState) { setScenario('contacts'); playAudio('click'); } }} disabled={isRunningState}>👥 Contacts</button>
                    <button className="btn-primary" style={{ ...styles.algoBtn, padding: '8px', minWidth: '120px', fontSize: '0.9rem', ...(scenario === 'attendance' ? styles.activeScenario : {}) }} onClick={() => { if (!isRunningState) { setScenario('attendance'); playAudio('click'); } }} disabled={isRunningState}>📋 Attendance</button>
                </div>

                {/* Protocol Selection Toggle */}
                <div style={{ ...styles.algoToggle, marginTop: '5px' }}>
                    <button
                        className="btn-primary"
                        style={{ ...styles.algoBtn, ...(algo === 'linear' ? styles.activeAlgo : {}) }}
                        onClick={() => { if (!isRunningState) { setAlgo('linear'); playAudio('click'); } }}
                        disabled={isRunningState}
                    >
                        {scenario === 'space' ? 'Linear Laser Protocol' : 'Linear Search'}
                    </button>
                    <button
                        className="btn-primary"
                        style={{ ...styles.algoBtn, ...(algo === 'binary' ? styles.activeAlgo : {}) }}
                        onClick={() => { if (!isRunningState) { setAlgo('binary'); playAudio('click'); } }}
                        disabled={isRunningState}
                    >
                        {scenario === 'space' ? 'Binary Hyper-Jump Protocol' : 'Binary Search'}
                    </button>
                </div>

                <div style={styles.inputsRow}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>{scenario === 'space' ? 'Enemy Freq:' : scenario === 'contacts' ? 'Name:' : 'Student Roll No:'}</label>
                        <input
                            type={scenario === 'contacts' ? "text" : "number"}
                            placeholder={scenario === 'space' ? "Lock On..." : scenario === 'contacts' ? "Search Name..." : "Search Roll No..."}
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            style={styles.input}
                            disabled={isRunningState}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Speed Engine:</label>
                        <select
                            value={speedMultiplier}
                            onChange={(e) => { playAudio('click'); setSpeedMultiplier(Number(e.target.value)); }}
                            style={styles.select}
                            disabled={isRunningState}
                        >
                            <option value={800}>Charge Pulse (Slow)</option>
                            <option value={300}>Plasma Cannon (Med)</option>
                            <option value={50}>Gatling Laser (Fast)</option>
                        </select>
                    </div>

                    <div style={styles.btnGroup}>
                        {!isRunningState ? (
                            <button className="btn-primary" onClick={executeSearch} style={styles.launchBtn}>
                                <Zap size={18} /> {scenario === 'space' ? 'FIRE!' : 'SEARCH'}
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={handlePauseToggle} style={{ ...styles.launchBtn, ...(isPausedState ? styles.pausedBtn : {}) }}>
                                {isPausedState ? 'RESUME' : 'PAUSE'}
                            </button>
                        )}
                        <button className="btn-primary" onClick={generateArray} disabled={isRunningState && !isPausedState} style={styles.actionBtn}>
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ ...styles.inputsRow, marginTop: '20px' }}>
                    <div style={{ ...styles.inputGroup, width: '100%', maxWidth: '600px', flexDirection: 'row', alignItems: 'flex-end', gap: '10px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={styles.label}>Custom Array (comma separated):</label>
                            <input
                                type="text"
                                placeholder="e.g. 10, 4, 30, 99 OR Apple, Banana, Orange"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                style={{ ...styles.input, width: '100%', textAlign: 'left' }}
                                disabled={isRunningState}
                            />
                        </div>
                        <button className="btn-primary" onClick={handleCustomSubmit} disabled={isRunningState} style={{ ...styles.launchBtn, height: '47px', padding: '0 20px', fontSize: '1rem', letterSpacing: '1px' }}>
                            Load Custom
                        </button>
                    </div>
                </div>
            </div>

            <div style={styles.hudMsg}>
                <div style={styles.statusBox}>
                    <div style={{ ...styles.statusDot, background: isRunningState ? 'var(--scan-color)' : 'var(--error-color)', boxShadow: `0 0 10px ${isRunningState ? 'var(--scan-color)' : 'transparent'}` }} />
                    <span>{statusMsg}</span>
                </div>
            </div>

            {/* Visualizer Environment Area with Internal HUD */}
            <div className="glass-panel" style={{ ...styles.visualizerContainer, ...(isShaking ? styles.shake : {}) }}>
                <div style={styles.internalHudContainer}>
                    <div style={styles.internalHudLeft}>
                        <h4 style={styles.hudHeading}>STEPS</h4>
                        <div style={styles.stepsValue}>{steps}</div>
                    </div>

                    {scenario === 'space' && (
                        <div style={styles.internalHudRight}>
                            <div style={{ ...styles.energyBarContainer, border: `1px solid ${energy > 300 ? 'var(--accent-secondary)' : 'var(--error-color)'}` }}>
                                <div style={{
                                    ...styles.energyBarFill,
                                    width: `${(energy / MAX_ENERGY) * 100}%`,
                                    backgroundColor: energy > 300 ? 'var(--accent-secondary)' : 'var(--error-color)'
                                }} />
                                <span style={styles.energyText}>ENERGY: {Math.max(energy, 0)} / {MAX_ENERGY}</span>
                            </div>
                        </div>
                    )}
                </div>
                {array.map((item, idx) => {
                    const isStr = typeof item.display === 'string' && !item.display.startsWith('Roll');
                    return (
                        <div key={idx} style={styles.barContainer}>
                            <span style={{ ...styles.valText, fontSize: (scenario === 'contacts' || isStr) ? '0.7rem' : '0.9rem', writingMode: (scenario === 'contacts' || isStr) ? 'vertical-rl' : 'horizontal-tb', transform: (scenario === 'contacts' || isStr) ? 'rotate(180deg)' : 'none', marginBottom: (scenario === 'contacts' || isStr) ? '5px' : '10px' }}>{item.display}</span>
                            <div
                                className={getBarClass(idx)}
                                style={{
                                    ...styles.bar,
                                    height: `${item.height}px`,
                                    backgroundColor: getBarColor(idx),
                                    opacity: getBarColor(idx).startsWith('rgba') ? 0.3 : 1,
                                    boxShadow: getBarColor(idx).startsWith('rgba') ? 'none' : `0 0 15px ${getBarColor(idx)}`,
                                    border: `1px solid ${getBarColor(idx)}`,
                                    flexShrink: 0
                                }}
                            />
                            <span style={styles.idxText}>[{idx}]</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        marginTop: '20px'
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '20px',
        padding: '25px',
        border: '1px solid var(--accent-danger)',
        boxShadow: 'inset 0 0 20px rgba(255, 0, 60, 0.1)'
    },
    algoToggle: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    algoBtn: {
        flex: 1,
        minWidth: '200px',
        maxWidth: '300px',
        opacity: 0.6,
        padding: '12px 20px',
        fontSize: '1.1rem',
        textTransform: 'uppercase'
    },
    activeAlgo: {
        opacity: 1,
        backgroundColor: 'var(--accent-danger)',
        borderColor: 'var(--accent-danger)',
        color: '#fff',
        fontWeight: 'bold',
        boxShadow: '0 0 15px var(--accent-danger)'
    },
    activeScenario: {
        opacity: 1,
        backgroundColor: 'var(--accent-primary)',
        borderColor: 'var(--accent-primary)',
        color: 'var(--bg-primary)',
        fontWeight: 'bold',
        boxShadow: '0 0 15px var(--accent-primary)'
    },
    inputsRow: {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    label: {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.85rem',
        color: 'var(--accent-danger)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
    },
    input: {
        padding: '12px 15px',
        borderRadius: '4px',
        border: '1px solid var(--accent-danger)',
        background: 'rgba(255,0,0,0.05)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '1.2rem',
        outline: 'none',
        width: '180px',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    select: {
        padding: '12px 15px',
        borderRadius: '4px',
        border: '1px solid var(--accent-danger)',
        background: 'rgba(255,0,0,0.05)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        outline: 'none',
        cursor: 'pointer'
    },
    btnGroup: {
        display: 'flex',
        gap: '10px',
        alignItems: 'stretch',
        height: '47px'
    },
    launchBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 30px',
        fontWeight: '900',
        fontSize: '1.2rem',
        letterSpacing: '3px',
        backgroundColor: 'rgba(255, 0, 60, 0.2)',
        borderColor: 'var(--accent-danger)',
        color: 'var(--accent-danger)',
        textShadow: '0 0 10px var(--accent-danger)'
    },
    pausedBtn: {
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        borderColor: '#FFA500',
        color: '#FFA500',
        animation: 'pulse 1.5s infinite alternate'
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 15px',
        borderColor: 'var(--accent-danger)',
        color: 'var(--accent-danger)'
    },
    hudHeading: {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.9rem',
        color: 'var(--accent-cyan)',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        marginBottom: '5px',
        textShadow: '0 0 5px var(--accent-cyan)'
    },
    stepsValue: {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.8rem',
        color: 'var(--accent-cyan)',
        textShadow: '0 0 10px var(--accent-cyan)'
    },
    energyBarContainer: {
        width: '280px',
        height: '36px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '18px',
        position: 'relative',
        overflow: 'hidden'
    },
    energyBarFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        transition: 'width 0.3s ease, background-color 0.3s ease',
        boxShadow: '0 0 10px var(--scan-color)'
    },
    energyText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textShadow: '0 0 5px rgba(0,0,0,0.8)',
        zIndex: 2,
        whiteSpace: 'nowrap'
    },
    hudMsg: {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.4rem',
        textAlign: 'center',
        margin: '25px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        textTransform: 'uppercase',
        letterSpacing: '2px'
    },
    statusBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        borderRadius: '25px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
    },
    statusDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        transition: 'background 0.3s ease, box-shadow 0.3s ease'
    },
    visualizerContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '8px',
        height: '550px',
        padding: '60px 10px 10px 10px',
        overflowX: 'auto',
        borderBottom: '4px solid var(--glass-border)',
        position: 'relative', // Added for internal HUD positioning
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glow-shadow)'
    },
    internalHudContainer: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none', // Prevent HUD from blocking clicks on the graph
        zIndex: 10
    },
    internalHudLeft: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    internalHudRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    shake: {
        animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
    },
    barContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
        width: '45px',
        position: 'relative'
    },
    valText: {
        marginBottom: '10px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        fontFamily: 'var(--font-body)',
        color: 'var(--accent-cyan)'
    },
    idxText: {
        marginTop: '10px',
        fontSize: '0.75rem',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        opacity: 0.7
    },
    bar: {
        width: '100%',
        borderRadius: '2px 2px 0 0',
        transition: 'height 0.3s, background-color 0.1s, opacity 0.5s',
    }
};

export default Visualizer;
