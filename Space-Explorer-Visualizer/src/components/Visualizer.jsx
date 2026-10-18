import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { 
    Play, 
    Pause, 
    StepForward, 
    RotateCcw, 
    Zap, 
    Crosshair, 
    Activity, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Sparkles, 
    Compass,
    Gauge,
    Layers
} from 'lucide-react';
import { database } from '../firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logSearchEvent = (algorithm, targetVal, success, energyLeft, comparisons) => {
    if (!database) return;
    try {
        const logRef = push(ref(database, 'search_logs'));
        set(logRef, {
            user: localStorage.getItem('spaceUserName') || 'Commander',
            algorithm,
            target: targetVal,
            success,
            energyRemaining: energyLeft,
            comparisons,
            timestamp: serverTimestamp()
        }).catch(() => {});
    } catch {
        // Safe fallback
    }
};

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
    const [customValidation, setCustomValidation] = useState({ duplicates: [], isUnsorted: false });
    const [target, setTarget] = useState('');
    
    // Interactive Speed Control (0.5x to 3.0x)
    const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
    const delayMs = useMemo(() => Math.round(500 / speedMultiplier), [speedMultiplier]);

    // Algorithmic tracking states
    const [activeIndices, setActiveIndices] = useState([]);
    const [foundIndex, setFoundIndex] = useState(null);
    const [leftBound, setLeftBound] = useState(null);
    const [rightBound, setRightBound] = useState(null);
    const [discardedIndices, setDiscardedIndices] = useState(new Set());
    const [comparisons, setComparisons] = useState(0);
    const [steps, setSteps] = useState(0);
    const [searchStatus, setSearchStatus] = useState('IDLE'); // 'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'

    // Gamification state
    const MAX_ENERGY = 1000;
    const [energy, setEnergy] = useState(MAX_ENERGY);
    const [isShaking, setIsShaking] = useState(false);

    // Responsive container measurement
    const visualizerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1000);

    useEffect(() => {
        if (!visualizerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });
        observer.observe(visualizerRef.current);
        return () => observer.disconnect();
    }, []);

    // Core execution & step-forward controller refs
    const [isRunningState, setIsRunningState] = useState(false);
    const isRunningRef = useRef(false);

    const [isPausedState, setIsPausedState] = useState(false);
    const isPausedRef = useRef(false);

    const pauseResolverRef = useRef(null);

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
            if (pauseResolverRef.current) {
                pauseResolverRef.current();
                pauseResolverRef.current = null;
            }
        };
    }, [algo, scenario]);

    // Check custom array for duplicates and sorted state
    const validateCustomItems = (items, isNumeric) => {
        const counts = {};
        const duplicates = [];
        let isUnsorted = false;

        const compareValues = items.map(v => isNumeric ? Number(v) : v.toLowerCase());
        
        for (let i = 0; i < compareValues.length; i++) {
            const val = compareValues[i];
            counts[val] = (counts[val] || 0) + 1;
            if (counts[val] === 2) duplicates.push(items[i]);
            if (i > 0) {
                if (isNumeric) {
                    if (compareValues[i] < compareValues[i - 1]) isUnsorted = true;
                } else {
                    if (compareValues[i].localeCompare(compareValues[i - 1]) < 0) isUnsorted = true;
                }
            }
        }
        return { duplicates, isUnsorted };
    };

    const generateArray = () => {
        if (pauseResolverRef.current) {
            pauseResolverRef.current();
            pauseResolverRef.current = null;
        }
        if (!isRunningState) playAudio('click');
        const newArr = [];
        setIsCustom(false);
        setCustomInput('');
        setCustomValidation({ duplicates: [], isUnsorted: false });

        if (scenario === 'space') {
            for (let i = 0; i < 24; i++) {
                const val = Math.floor(Math.random() * 100) + 1;
                newArr.push({ display: val, compare: val, height: Math.max(val * 2.8, 25) });
            }
            if (algo === 'binary') newArr.sort((a, b) => a.compare - b.compare);
            setStatusMsg(`RADAR: New enemy fleet detected. Weapon: ${algo.toUpperCase()} PROTOCOL`);
        } else if (scenario === 'contacts') {
            const names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Ken", "Leo", "Mia", "Neo", "Olivia", "Peggy", "Quinn", "Rupert", "Sybil", "Trent", "Uma", "Victor", "Walter", "Xena", "Yara", "Zoe"];
            const shuffled = [...names].sort(() => 0.5 - Math.random());
            let selected = shuffled.slice(0, 24);
            if (algo === 'binary') selected.sort();
            selected.forEach(name => {
                newArr.push({ display: name, compare: name.toLowerCase(), height: Math.floor(Math.random() * 150) + 50 });
            });
            setStatusMsg(`DIRECTORY: Loaded contacts. Mode: ${algo.toUpperCase()} SEARCH`);
            setTarget('');
        } else if (scenario === 'attendance') {
            const rollNumbers = [];
            for (let i = 1; i <= 50; i++) rollNumbers.push(i);
            const shuffled = rollNumbers.sort(() => 0.5 - Math.random()).slice(0, 24);
            if (algo === 'binary') shuffled.sort((a, b) => a - b);

            shuffled.forEach(val => {
                newArr.push({ display: `Roll ${val}`, compare: val, height: (val / 50) * 190 + 40 });
            });
            setStatusMsg(`ATTENDANCE: ${algo === 'binary' ? 'Sorted class roster' : 'Unsorted attendance sheet'}. Mode: ${algo.toUpperCase()}`);
        }

        if (newArr.length > 0) {
            const randomPick = newArr[Math.floor(Math.random() * newArr.length)];
            setTarget(String(scenario === 'attendance' ? randomPick.compare : randomPick.display));
        }

        setArray(newArr);
        resetState();
        setEnergy(MAX_ENERGY);
    };

    const handleCustomSubmit = () => {
        if (!customInput.trim()) return;
        const items = customInput.split(',').map(v => v.trim()).filter(Boolean);
        if (items.length === 0) return;

        const isNumeric = items.every(v => !isNaN(Number(v)));
        const validation = validateCustomItems(items, isNumeric);
        setCustomValidation(validation);

        let processedItems = [...items];
        if (algo === 'binary' && validation.isUnsorted) {
            // Auto sort for binary search compatibility
            if (isNumeric) {
                processedItems.sort((a, b) => Number(a) - Number(b));
            } else {
                processedItems.sort((a, b) => a.localeCompare(b));
            }
        }

        const newArr = [];
        if (isNumeric) {
            const numItems = processedItems.map(Number);
            const maxVal = Math.max(...numItems, 1);
            numItems.forEach(val => {
                newArr.push({ display: val, compare: val, height: Math.max((val / maxVal) * 200, 25) });
            });
        } else {
            processedItems.forEach(val => {
                newArr.push({ display: val, compare: val.toLowerCase(), height: Math.floor(Math.random() * 150) + 50 });
            });
        }

        setArray(newArr);
        setIsCustom(true);
        resetState();
        setEnergy(MAX_ENERGY);
        setTarget(String(newArr[0]?.display || ''));
        setStatusMsg(`CUSTOM DATA: Loaded ${newArr.length} items. Mode: ${algo.toUpperCase()} SEARCH`);
        playAudio('click');
    };

    const handleManualSort = () => {
        if (!array.length) return;
        const sorted = [...array].sort((a, b) => {
            if (typeof a.compare === 'number' && typeof b.compare === 'number') {
                return a.compare - b.compare;
            }
            return String(a.compare).localeCompare(String(b.compare));
        });
        setArray(sorted);
        setCustomValidation(prev => ({ ...prev, isUnsorted: false }));
        setStatusMsg('PROTOCOL: Array successfully sorted for Binary Search.');
        playAudio('click');
    };

    const resetState = () => {
        setActiveIndices([]);
        setFoundIndex(null);
        setLeftBound(null);
        setRightBound(null);
        setDiscardedIndices(new Set());
        setSteps(0);
        setComparisons(0);
        setSearchStatus('IDLE');
        setStatusMsg('Awaiting parameters...');
        setIsRunning(false);
        setIsPaused(false);
        if (pauseResolverRef.current) {
            pauseResolverRef.current();
            pauseResolverRef.current = null;
        }
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    // Pause/Resume and Step-by-Step execution
    const checkPause = async () => {
        if (!isRunningRef.current) return;
        if (isPausedRef.current) {
            await new Promise((resolve) => {
                pauseResolverRef.current = resolve;
            });
        }
    };

    const handlePauseToggle = () => {
        if (!isRunningRef.current) return;
        playAudio('click');
        if (isPausedState) {
            // Resume
            setIsPaused(false);
            if (pauseResolverRef.current) {
                const resolve = pauseResolverRef.current;
                pauseResolverRef.current = null;
                resolve();
            }
            setStatusMsg('RESUMING: Search cycle running.');
        } else {
            // Pause
            setIsPaused(true);
            setStatusMsg('SYSTEM PAUSED: Single-step or resume when ready.');
        }
    };

    const handleStepForward = () => {
        playAudio('click');
        if (!isRunningRef.current) {
            // Start paused and take first step
            setIsPaused(true);
            executeSearch(true);
            return;
        }
        // Ensure paused, then advance one step
        setIsPaused(true);
        if (pauseResolverRef.current) {
            const resolve = pauseResolverRef.current;
            pauseResolverRef.current = null;
            resolve();
        }
    };

    const executeSearch = async (startPaused = false) => {
        if (isRunningState && !isPausedState) return;

        let targetVal = target;
        if (isCustom) {
            const firstItemCompare = array[0]?.compare;
            if (typeof firstItemCompare === 'number') {
                targetVal = parseInt(target, 10);
                if (isNaN(targetVal)) {
                    setStatusMsg('ERROR: Invalid Numeric Target.');
                    playAudio('error');
                    triggerShake();
                    return;
                }
            } else {
                targetVal = targetVal.trim().toLowerCase();
                if (!targetVal) {
                    setStatusMsg('ERROR: Invalid String Target.');
                    playAudio('error');
                    triggerShake();
                    return;
                }
            }
        } else if (scenario === 'space' || scenario === 'attendance') {
            targetVal = parseInt(target, 10);
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

        // Reset runtime values
        setActiveIndices([]);
        setFoundIndex(null);
        setLeftBound(null);
        setRightBound(null);
        setDiscardedIndices(new Set());
        setSteps(0);
        setComparisons(0);
        setEnergy(MAX_ENERGY);
        setSearchStatus('SEARCHING');

        setIsRunning(true);
        if (startPaused) {
            setIsPaused(true);
        } else {
            setIsPaused(false);
        }

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

    const depleteEnergy = (amount) => {
        setEnergy((prev) => {
            const next = prev - amount;
            return next < 0 ? 0 : next;
        });
    };

    const linearSearch = async (val) => {
        const energyCost = Math.max(10, Math.floor(MAX_ENERGY / (array.length || 1)));
        let currentComparisons = 0;

        for (let i = 0; i < array.length; i++) {
            if (!isRunningRef.current) break;
            await checkPause();
            if (!isRunningRef.current) break;

            currentComparisons++;
            setComparisons(currentComparisons);
            setSteps(i + 1);
            setActiveIndices([i]);
            setStatusMsg(scenario === 'space' ? `FIRING LASER at Sector [${i}]...` : `SCANNING entry [${i}] for ${val}...`);
            playAudio('click');
            depleteEnergy(energyCost);

            await sleep(delayMs);

            if (array[i].compare === val) {
                setFoundIndex(i);
                setSearchStatus('FOUND');
                setStatusMsg(scenario === 'space' ? `TARGET DESTROYED at coordinate [${i}]!` : `MATCH FOUND at position [${i}]!`);
                logSearchEvent('linear', val, true, energy - energyCost, currentComparisons);
                playAudio('success');
                triggerShake();
                return;
            }
        }

        if (isRunningRef.current) {
            setEnergy(0);
            setSearchStatus('NOT_FOUND');
            setStatusMsg(scenario === 'space' ? `AMMO DEPLETED. Enemy escaped.` : `SEARCH FAILED. Target missing.`);
            logSearchEvent('linear', val, false, 0, currentComparisons);
            playAudio('error');
        }
    };

    const binarySearch = async (val) => {
        let l = 0;
        let r = array.length - 1;
        let currentComparisons = 0;
        let currentStep = 0;
        setDiscardedIndices(new Set());

        while (l <= r) {
            if (!isRunningRef.current) break;
            await checkPause();
            if (!isRunningRef.current) break;

            currentStep++;
            setSteps(currentStep);

            // Lock bounds
            setLeftBound(l);
            setRightBound(r);
            setStatusMsg(scenario === 'space' ? `ISOLATING SECTORS [${l} ... ${r}]. Preparing Hyper-Jump.` : `NARROWING SEARCH to [${l} ... ${r}].`);
            playAudio('click');
            depleteEnergy(20);
            await sleep(Math.round(delayMs * 0.7));

            if (!isRunningRef.current) break;
            await checkPause();
            if (!isRunningRef.current) break;

            const m = Math.floor((l + r) / 2);
            currentComparisons++;
            setComparisons(currentComparisons);
            setActiveIndices([m]);
            setStatusMsg(scenario === 'space' ? `HYPER-JUMP to Sector [${m}]! Comparing target...` : `CHECKING middle position [${m}]...`);
            playAudio('click');
            triggerShake();

            await sleep(delayMs);

            const mVal = array[m].compare;
            if (mVal === val) {
                setFoundIndex(m);
                setSearchStatus('FOUND');
                setStatusMsg(scenario === 'space' ? `TARGET DESTROYED at coordinate [${m}]!` : `MATCH FOUND at position [${m}]!`);
                logSearchEvent('binary', val, true, energy - 20, currentComparisons);
                playAudio('success');
                triggerShake();
                return;
            }

            if (mVal < val) {
                setStatusMsg(scenario === 'space' ? `Target higher than sector [${m}]. Discarding left.` : `Alphabetically/Numerically higher. Discarding left.`);
                setDiscardedIndices((prev) => {
                    const next = new Set(prev);
                    for (let i = l; i <= m; i++) next.add(i);
                    return next;
                });
                l = m + 1;
            } else {
                setStatusMsg(scenario === 'space' ? `Target lower than sector [${m}]. Discarding right.` : `Alphabetically/Numerically lower. Discarding right.`);
                setDiscardedIndices((prev) => {
                    const next = new Set(prev);
                    for (let i = m; i <= r; i++) next.add(i);
                    return next;
                });
                r = m - 1;
            }
            playAudio('click');
            await sleep(Math.round(delayMs * 0.8));
        }

        if (isRunningRef.current) {
            setLeftBound(null);
            setRightBound(null);
            setEnergy(0);
            setSearchStatus('NOT_FOUND');
            setStatusMsg(scenario === 'space' ? `TRACKING FAILED. Enemy lost in deep space.` : `SEARCH FAILED. Target missing.`);
            logSearchEvent('binary', val, false, 0, currentComparisons);
            playAudio('error');
        }
    };

    const getBarColor = (index) => {
        if (foundIndex !== null && foundIndex !== index) return 'rgba(128, 128, 128, 0.2)';
        if (foundIndex === index) return 'var(--success-color)';
        if (activeIndices.includes(index)) return 'var(--search-active)';
        if (discardedIndices.has(index)) return 'rgba(128, 128, 128, 0.2)';
        if (algo === 'binary' && leftBound !== null && rightBound !== null) {
            if (index < leftBound || index > rightBound) return 'rgba(128, 128, 128, 0.2)';
        }
        return 'var(--accent-primary)';
    };

    const getBarClass = (index) => {
        if (foundIndex === index) return 'animate-explode';
        if (activeIndices.includes(index)) return 'animate-laser';
        return '';
    };

    // Responsive bar sizing calculations
    const nodeWidth = useMemo(() => {
        const available = containerWidth - 32;
        const total = array.length || 1;
        const computed = Math.floor((available - total * 4) / total);
        return Math.max(14, Math.min(48, computed));
    }, [containerWidth, array.length]);

    const isCompactMobile = containerWidth < 440;

    return (
        <div style={styles.container} className={isShaking ? 'animate-shake' : ''}>
            {/* Top Command Controls */}
            <div className="glass-panel" style={styles.controls}>
                {/* Scenario Toggle */}
                <div style={styles.algoToggle}>
                    <button 
                        className="btn-primary" 
                        style={{ ...styles.algoBtn, ...(scenario === 'space' ? styles.activeScenario : {}) }} 
                        onClick={() => { if (!isRunningState) { setScenario('space'); playAudio('click'); } }} 
                        disabled={isRunningState}
                    >
                        🚀 Space Fleet
                    </button>
                    <button 
                        className="btn-primary" 
                        style={{ ...styles.algoBtn, ...(scenario === 'contacts' ? styles.activeScenario : {}) }} 
                        onClick={() => { if (!isRunningState) { setScenario('contacts'); playAudio('click'); } }} 
                        disabled={isRunningState}
                    >
                        👥 Contacts Book
                    </button>
                    <button 
                        className="btn-primary" 
                        style={{ ...styles.algoBtn, ...(scenario === 'attendance' ? styles.activeScenario : {}) }} 
                        onClick={() => { if (!isRunningState) { setScenario('attendance'); playAudio('click'); } }} 
                        disabled={isRunningState}
                    >
                        📋 Attendance List
                    </button>
                </div>

                {/* Protocol Selection Toggle */}
                <div style={{ ...styles.algoToggle, marginTop: '8px' }}>
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

                {/* Real-time Algorithmic Metric Badges */}
                <div style={styles.metricsBadgeRow}>
                    <div style={styles.metricBadge}>
                        <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
                        <div>
                            <span style={styles.badgeLabel}>Comparisons</span>
                            <strong style={styles.badgeValue}>{comparisons}</strong>
                        </div>
                    </div>

                    <div style={styles.metricBadge}>
                        <Layers size={18} style={{ color: 'var(--accent-secondary)' }} />
                        <div>
                            <span style={styles.badgeLabel}>Time Complexity</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                <strong style={{ ...styles.badgeValue, color: 'var(--accent-secondary)' }}>
                                    {algo === 'linear' ? 'O(N)' : 'O(log N)'}
                                </strong>
                                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                                    {algo === 'linear' ? 'Worst: N | Best: 1' : `Max: ~${Math.ceil(Math.log2(array.length || 1))} steps`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={styles.metricBadge}>
                        {searchStatus === 'FOUND' ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--success-color)' }} />
                        ) : searchStatus === 'NOT_FOUND' ? (
                            <XCircle size={18} style={{ color: 'var(--error-color)' }} />
                        ) : searchStatus === 'SEARCHING' ? (
                            <Crosshair size={18} style={{ color: 'var(--search-active)' }} className="animate-pulse" />
                        ) : (
                            <Compass size={18} style={{ color: 'var(--text-secondary)' }} />
                        )}
                        <div>
                            <span style={styles.badgeLabel}>Search Status</span>
                            <strong style={{
                                ...styles.badgeValue,
                                color: searchStatus === 'FOUND' 
                                    ? 'var(--success-color)' 
                                    : searchStatus === 'NOT_FOUND' 
                                        ? 'var(--error-color)' 
                                        : searchStatus === 'SEARCHING' 
                                            ? 'var(--search-active)' 
                                            : 'var(--text-primary)'
                            }}>
                                {searchStatus === 'FOUND' ? `LOCKED [${foundIndex}]` : searchStatus === 'NOT_FOUND' ? 'NOT DETECTED' : searchStatus === 'SEARCHING' ? 'SCANNING...' : 'READY'}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Primary Interaction Inputs & Step Buttons */}
                <div style={styles.inputsRow}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>{scenario === 'space' ? 'Target Value:' : scenario === 'contacts' ? 'Target Name:' : 'Roll Number:'}</label>
                        <input
                            type={scenario === 'contacts' ? "text" : "number"}
                            placeholder={scenario === 'space' ? "Lock On..." : scenario === 'contacts' ? "Search Name..." : "Search Roll No..."}
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            style={styles.input}
                            disabled={isRunningState && !isPausedState}
                        />
                    </div>

                    {/* Interactive Speed Slider with Millisecond & Multiplier Labels */}
                    <div style={styles.speedControlGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={styles.label}>
                                <Gauge size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                Speed Engine:
                            </label>
                            <span style={styles.speedLabelValue}>{speedMultiplier.toFixed(1)}x ({delayMs}ms)</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={speedMultiplier}
                            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                            style={styles.speedSlider}
                            aria-label="Search speed multiplier"
                        />
                        <div style={styles.presetRow}>
                            <button type="button" className="touch-target" style={styles.presetBtn} onClick={() => setSpeedMultiplier(0.5)}>0.5x Slow</button>
                            <button type="button" className="touch-target" style={styles.presetBtn} onClick={() => setSpeedMultiplier(1.0)}>1.0x Normal</button>
                            <button type="button" className="touch-target" style={styles.presetBtn} onClick={() => setSpeedMultiplier(2.0)}>2.0x Fast</button>
                            <button type="button" className="touch-target" style={styles.presetBtn} onClick={() => setSpeedMultiplier(3.0)}>3.0x Warp</button>
                        </div>
                    </div>

                    {/* Action Execution Button Group: Play, Pause, Step Forward, Reset */}
                    <div style={styles.btnGroup}>
                        {!isRunningState ? (
                            <button className="btn-primary" onClick={() => executeSearch(false)} style={styles.launchBtn} title="Start Search Execution">
                                <Zap size={18} /> {scenario === 'space' ? 'FIRE!' : 'SEARCH'}
                            </button>
                        ) : (
                            <button 
                                className="btn-primary" 
                                onClick={handlePauseToggle} 
                                style={{ ...styles.launchBtn, ...(isPausedState ? styles.pausedBtn : {}) }}
                                title={isPausedState ? 'Resume Execution' : 'Pause Execution'}
                            >
                                {isPausedState ? <Play size={18} /> : <Pause size={18} />}
                                {isPausedState ? 'RESUME' : 'PAUSE'}
                            </button>
                        )}

                        <button 
                            className="btn-primary" 
                            onClick={handleStepForward} 
                            style={styles.stepBtn}
                            title="Step forward one comparison"
                        >
                            <StepForward size={18} />
                            <span className="hide-on-mobile">STEP</span>
                        </button>

                        <button 
                            className="btn-primary" 
                            onClick={generateArray} 
                            style={styles.actionBtn}
                            title="Reset and generate new dataset"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                {/* Custom Array Input with Duplicate & Unsorted Validation */}
                <div style={styles.customArraySection}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={styles.label}>Custom Array Input (Comma-Separated):</label>
                            {customValidation.duplicates.length > 0 && (
                                <span style={styles.validationWarning}>
                                    <AlertTriangle size={14} /> Duplicate values: {customValidation.duplicates.slice(0, 3).join(', ')}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. 12, 24, 38, 45, 60, 77, 89 OR Alpha, Bravo, Charlie"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            style={{ ...styles.input, width: '100%', textAlign: 'left' }}
                            disabled={isRunningState}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <button 
                            className="btn-primary" 
                            onClick={handleCustomSubmit} 
                            disabled={isRunningState} 
                            style={{ ...styles.launchBtn, height: '46px', padding: '0 18px', fontSize: '0.95rem' }}
                        >
                            <Sparkles size={16} /> Load Custom
                        </button>
                        {customValidation.isUnsorted && algo === 'binary' && (
                            <button 
                                className="btn-primary" 
                                onClick={handleManualSort} 
                                style={{ ...styles.launchBtn, height: '46px', padding: '0 14px', fontSize: '0.85rem', borderColor: 'var(--accent-secondary)' }}
                                title="Sort array in ascending order for binary search"
                            >
                                Sort Array ⚡
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Broadcast Bar */}
            <div style={styles.hudMsg}>
                <div style={styles.statusBox}>
                    <div style={{ 
                        ...styles.statusDot, 
                        background: isRunningState ? 'var(--scan-color)' : 'var(--error-color)', 
                        boxShadow: `0 0 10px ${isRunningState ? 'var(--scan-color)' : 'transparent'}` 
                    }} />
                    <span>{statusMsg}</span>
                </div>
            </div>

            {/* Responsive Visualizer Environment Area with Internal HUD */}
            <div 
                ref={visualizerRef}
                className="glass-panel" 
                style={{ ...styles.visualizerContainer, ...(isShaking ? styles.shake : {}) }}
            >
                <div style={styles.internalHudContainer}>
                    <div style={styles.internalHudLeft}>
                        <h4 style={styles.hudHeading}>CYCLE STEPS</h4>
                        <div style={styles.stepsValue}>{steps}</div>
                    </div>

                    {scenario === 'space' && (
                        <div style={styles.internalHudRight}>
                            <div style={{ 
                                ...styles.energyBarContainer, 
                                border: `1px solid ${energy > 300 ? 'var(--accent-secondary)' : 'var(--error-color)'}` 
                            }}>
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

                {/* Nodes & Planetary Orbit Bars */}
                <div style={styles.barsWrapper}>
                    {array.map((item, idx) => {
                        const isStr = typeof item.display === 'string' && !item.display.startsWith('Roll');
                        const barColor = getBarColor(idx);
                        const isDimmed = barColor.startsWith('rgba');

                        return (
                            <div
                                key={idx}
                                style={{ 
                                    ...styles.barContainer, 
                                    width: `${nodeWidth}px`,
                                    cursor: isRunningState ? 'default' : 'pointer' 
                                }}
                                onClick={() => {
                                    if (!isRunningState) {
                                        playAudio('click');
                                        setTarget(String(scenario === 'attendance' ? item.compare : item.display));
                                        setStatusMsg(`COORDINATES LOCKED: Target set to ${item.display}`);
                                    }
                                }}
                                title={`Click to set target to ${item.display}`}
                            >
                                {/* Celestial Planet Node Avatar */}
                                <div 
                                    style={{
                                        ...styles.planetNode,
                                        width: `${Math.min(nodeWidth, 28)}px`,
                                        height: `${Math.min(nodeWidth, 28)}px`,
                                        background: isDimmed 
                                            ? 'rgba(100, 100, 100, 0.3)' 
                                            : `radial-gradient(circle at 30% 30%, #fff, ${barColor})`,
                                        boxShadow: isDimmed ? 'none' : `0 0 10px ${barColor}`,
                                        opacity: isDimmed ? 0.3 : 1
                                    }}
                                />

                                <span style={{ 
                                    ...styles.valText, 
                                    fontSize: isCompactMobile || isStr ? '0.68rem' : '0.85rem',
                                    writingMode: (scenario === 'contacts' || isStr) ? 'vertical-rl' : 'horizontal-tb', 
                                    transform: (scenario === 'contacts' || isStr) ? 'rotate(180deg)' : 'none', 
                                    marginBottom: (scenario === 'contacts' || isStr) ? '4px' : '8px',
                                    opacity: isDimmed ? 0.4 : 1
                                }}>
                                    {item.display}
                                </span>

                                <div
                                    className={getBarClass(idx)}
                                    style={{
                                        ...styles.bar,
                                        height: `${item.height}px`,
                                        backgroundColor: barColor,
                                        opacity: isDimmed ? 0.25 : 1,
                                        boxShadow: isDimmed ? 'none' : `0 0 15px ${barColor}`,
                                        border: `1px solid ${barColor}`,
                                    }}
                                />
                                <span style={styles.idxText}>[{idx}]</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: 'clamp(12px, 3vw, 24px)',
        maxWidth: '1240px',
        margin: '0 auto',
        marginTop: '10px'
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '20px',
        padding: 'clamp(16px, 3vw, 24px)',
        border: '1px solid var(--accent-danger)',
        boxShadow: 'inset 0 0 20px rgba(255, 0, 60, 0.08)'
    },
    algoToggle: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    algoBtn: {
        flex: 1,
        minWidth: '150px',
        maxWidth: '280px',
        opacity: 0.65,
        padding: '10px 16px',
        fontSize: 'clamp(0.85rem, 2vw, 1rem)',
        textTransform: 'uppercase',
        borderRadius: '8px'
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
    metricsBadgeRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        margin: '8px 0'
    },
    metricBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
    badgeLabel: {
        display: 'block',
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--text-secondary)'
    },
    badgeValue: {
        display: 'block',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.05rem',
        color: 'var(--accent-cyan)'
    },
    inputsRow: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '160px',
        flex: 1
    },
    speedControlGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '220px',
        flex: 1.2
    },
    speedLabelValue: {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.8rem',
        color: 'var(--accent-cyan)'
    },
    speedSlider: {
        width: '100%',
        accentColor: 'var(--accent-primary)',
        cursor: 'pointer',
        height: '6px'
    },
    presetRow: {
        display: 'flex',
        gap: '6px',
        justifyContent: 'space-between',
        marginTop: '2px'
    },
    presetBtn: {
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--glass-border)',
        borderRadius: '4px',
        color: 'var(--text-secondary)',
        fontSize: '0.7rem',
        padding: '2px 6px',
        minHeight: '26px',
        minWidth: 'auto',
        cursor: 'pointer'
    },
    label: {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.8rem',
        color: 'var(--accent-danger)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px'
    },
    input: {
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--accent-danger)',
        background: 'rgba(255,0,0,0.04)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        outline: 'none',
        textAlign: 'center',
        fontWeight: 'bold',
        minHeight: '44px'
    },
    btnGroup: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        height: '46px',
        flexWrap: 'wrap'
    },
    launchBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '0 20px',
        fontWeight: '900',
        fontSize: '1rem',
        letterSpacing: '2px',
        backgroundColor: 'rgba(255, 0, 60, 0.15)',
        borderColor: 'var(--accent-danger)',
        color: 'var(--accent-danger)',
        textShadow: '0 0 10px var(--accent-danger)',
        height: '46px',
        minHeight: '46px'
    },
    stepBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '0 14px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        backgroundColor: 'rgba(0, 150, 255, 0.15)',
        borderColor: 'var(--accent-secondary)',
        color: 'var(--accent-secondary)',
        height: '46px',
        minHeight: '46px'
    },
    pausedBtn: {
        backgroundColor: 'rgba(255, 165, 0, 0.25)',
        borderColor: '#FFA500',
        color: '#FFA500'
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 14px',
        borderColor: 'var(--accent-danger)',
        color: 'var(--accent-danger)',
        height: '46px',
        minHeight: '46px'
    },
    customArraySection: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 0, 60, 0.15)'
    },
    validationWarning: {
        fontSize: '0.75rem',
        color: '#FFA500',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    hudHeading: {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.85rem',
        color: 'var(--accent-cyan)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '4px',
        textShadow: '0 0 5px var(--accent-cyan)'
    },
    stepsValue: {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.6rem',
        color: 'var(--accent-cyan)',
        textShadow: '0 0 10px var(--accent-cyan)'
    },
    energyBarContainer: {
        width: 'clamp(180px, 30vw, 260px)',
        height: '32px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '16px',
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
        color: '#fff',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.78rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textShadow: '0 0 5px rgba(0,0,0,0.9)',
        zIndex: 2,
        whiteSpace: 'nowrap'
    },
    hudMsg: {
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
        textAlign: 'center',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px'
    },
    statusBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 18px',
        borderRadius: '25px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.15)',
        maxWidth: '100%'
    },
    statusDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        flexShrink: 0
    },
    visualizerContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '520px',
        padding: '55px 12px 12px 12px',
        borderBottom: '4px solid var(--glass-border)',
        position: 'relative',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glow-shadow)',
        borderRadius: '16px'
    },
    barsWrapper: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '4px',
        height: '100%',
        width: '100%',
        overflowX: 'auto',
        paddingBottom: '6px'
    },
    internalHudContainer: {
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
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
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.2s ease'
    },
    planetNode: {
        borderRadius: '50%',
        marginBottom: '4px',
        transition: 'all 0.2s ease',
        flexShrink: 0
    },
    valText: {
        fontWeight: 'bold',
        fontFamily: 'var(--font-body)',
        color: 'var(--accent-cyan)',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    },
    idxText: {
        marginTop: '6px',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        opacity: 0.75
    },
    bar: {
        width: '100%',
        borderRadius: '4px 4px 0 0',
        transition: 'height 0.3s, background-color 0.15s, opacity 0.3s',
        minWidth: '8px'
    }
};

export default Visualizer;
