import React, { useState, useRef, useEffect, useContext } from 'react';

import { Bot, Send, X, MessageSquare } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { database } from '../firebase';
import { ref, push, set, serverTimestamp, get, query, orderByChild } from 'firebase/database';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { playAudio } = useContext(ThemeContext);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll dynamically
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const chatRef = ref(database, 'chat_logs');
                const chatQuery = query(chatRef, orderByChild('timestamp'));
                const snapshot = await get(chatQuery);

                if (snapshot.exists()) {
                    const logs = [];
                    snapshot.forEach((childSnapshot) => {
                        const data = childSnapshot.val();
                        // Map Firebase format to frontend format
                        // We store userMessage and botResponse in the same log entry
                        if (data.userMessage) {
                            logs.push({ text: data.userMessage, isBot: false });
                        }
                        if (data.botResponse) {
                            logs.push({ text: data.botResponse, isBot: true });
                        }
                    });
                    setMessages(logs);
                } else {
                    // Default welcome if database is empty
                    setMessages([{ text: "Greetings, Explorer! I am the Star-Command AI. Ask me about Linear Search or Binary Search missions.", isBot: true }]);
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
                setMessages([{ text: "Greetings, Explorer! Database offline. Using local memory.", isBot: true }]);
            }
        };
        fetchHistory();
    }, []);

    // Local AI Logic Ported from Python
    const generateBotResponse = async (msg) => {
        const lowerMsg = msg.toLowerCase();

        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000));

        let ai_response = "";

        const isLinear = lowerMsg.includes("linear search") || lowerMsg.includes("linear");
        const isBinary = lowerMsg.includes("binary search") || lowerMsg.includes("binary");

        const isAttendance = lowerMsg.includes("attendance");
        const isContacts = lowerMsg.includes("contact");
        const isSpace = lowerMsg.includes("space") || lowerMsg.includes("sector") || lowerMsg.includes("galaxy");

        if (isLinear) {
            if (isAttendance) {
                ai_response = "In real life, finding a student's roll number in an unsorted attendance sheet requires checking each name one-by-one from top to bottom (Linear Search). It's simple, but slow for huge classes.\n\nIn our Visualizer's 'Attendance' mode, you can watch it scan through each unsorted bar sequentially to demonstrate this.";
            } else if (isContacts) {
                ai_response = "In real life, finding someone in an unsorted stack of business contacts requires checking the first card, then the second, and so on until you find a match (Linear Search).\n\nIn our Visualizer's 'Contacts' mode, watch how it sequentially scans through the string names one-by-one.";
            } else if (isSpace) {
                ai_response = "Linear Search checks every single element one by one. Imagine exploring uncharted space without a map—you have to check sector 1, then sector 2, and so on.\n\nIn the Visualizer, the 'Linear Laser' demonstrates this by checking each coordinate sequentially.";
            } else {
                ai_response = "Linear Search is a fundamental algorithm that checks each item in a list one-by-one until it finds the target. It's perfectly reliable but slow for large datasets (Time Complexity: O(n)).\n\nIn our Visualizer, you can see this scanning process in action across the Space, Contacts, or Attendance lists.";
            }
        } else if (isBinary) {
            if (isAttendance) {
                ai_response = "If an attendance sheet is already sorted by roll number, you can use Binary Search! You check the middle of the list; if the target is smaller, you ignore the bottom half, and repeat. It's incredibly fast (O(log n)) but requires sorted data.\n\nIn the Visualizer, the 'Attendance' list will auto-sort when you choose Binary Search to demonstrate this prerequisite.";
            } else if (isContacts) {
                ai_response = "If your contacts are sorted alphabetically (like a phonebook), you use Binary Search. You open to the middle—if the name you want comes earlier alphabetically, you ignore the entire second half of the book, halving your search area instantly.\n\nIn our Visualizer, the 'Contacts' mode auto-sorts to demonstrate this.";
            } else if (isSpace) {
                ai_response = "Binary Search fundamentally requires data to be sorted. By checking the middle item, it instantly eliminates half of the remaining data based on whether the target is higher or lower.\n\nIn our Visualizer, the 'Binary Hyper-Jump' demonstrates this by halving the search area on every step.";
            } else {
                ai_response = "Binary Search is a highly efficient algorithm (Time Complexity: O(log n)) that finds an item by continually halving the search area. However, it ONLY works if the data is already sorted!\n\nOur Visualizer demonstrates this speed (and the sorting prerequisite) across the different scenarios.";
            }
        } else if (lowerMsg.includes("how") && lowerMsg.includes("work")) {
            ai_response = "Algorithms work by following a strict set of rules. Linear Search checks every single item sequentially. Binary Search is much smarter and faster—it halves the search area with every step—but it strictly requires the data to be sorted first!\n\nOur Visualizer lets you watch these steps happen in real-time.";
        } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
            ai_response = "Greetings, Explorer! Ask me 'what is linear search' or 'how is binary search used in an attendance sheet?'";
        } else if (lowerMsg.includes("time complexity") || lowerMsg.includes("o(n)") || lowerMsg.includes("o(log n)")) {
            ai_response = "Linear Search is O(n), meaning the time it takes grows directly with the amount of data. Binary Search is O(log n), making it perfectly fast for massive datasets, but the trade-off is your data MUST be sorted first!";
        } else if (lowerMsg.includes("who") && (lowerMsg.includes("made") || lowerMsg.includes("created"))) {
            ai_response = "This Visualizer was engineered to showcase React, Firebase, and algorithm expertise through real-world scenarios!";
        } else {
            const responses = [
                "My databanks are focused on searching algorithms. Ask me 'what is linear search' or 'how is binary search used in an attendance sheet'!",
                "I'm afraid I cannot process that request. The nebula interference is too strong.",
                "Please specify if you want to know about Linear or Binary search algorithms and their real-world uses."
            ];
            ai_response = responses[Math.floor(Math.random() * responses.length)];
        }
        return ai_response;
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        playAudio('click');
        const userMsg = input.trim();
        setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setLoading(true);

        try {
            const botMsg = await generateBotResponse(userMsg);
            setMessages((prev) => [...prev, { text: botMsg, isBot: true }]);
            playAudio('success'); // Notification sound

            // Save to Firebase Realtime Database without blocking the UI
            const chatRef = ref(database, 'chat_logs');
            const newLogRef = push(chatRef);
            set(newLogRef, {
                user: localStorage.getItem('spaceUserName') || 'Anonymous',
                userMessage: userMsg,
                botResponse: botMsg,
                timestamp: serverTimestamp()
            }).catch(err => console.error("Failed to sync chat to database:", err));

        } catch (err) {
            console.error("Chatbot Error:", err);
            setMessages((prev) => [...prev, { text: "Connection to Star-Command AI lost. Static interference detected.", isBot: true }]);
            playAudio('error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                className="glass-panel"
                style={styles.launcher}
                onClick={() => { playAudio('click'); setIsOpen(true); }}
            >
                <MessageSquare size={24} color="var(--accent-primary)" />
            </button>
        );
    }

    return (
        <div className="glass-panel" style={styles.chatWindow}>
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={20} color="var(--accent-primary)" />
                    <strong>STAR-COMMAND AI</strong>
                </div>
                <button onClick={() => { playAudio('toggle'); setIsOpen(false); }} style={styles.closeBtn}>
                    <X size={20} color="var(--text-primary)" />
                </button>
            </div>

            <div style={styles.messageArea}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ ...styles.messageBubble, alignSelf: msg.isBot ? 'flex-start' : 'flex-end', background: msg.isBot ? 'rgba(0,0,0,0.5)' : 'var(--accent-primary)', color: msg.isBot ? 'var(--text-primary)' : 'var(--bg-primary)' }}>
                        {msg.text}
                    </div>
                ))}
                {loading && <div style={{ ...styles.messageBubble, alignSelf: 'flex-start', background: 'rgba(0,0,0,0.5)' }}>Processing telemetry...</div>}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={styles.inputArea}>
                <input
                    type="text"
                    placeholder="Ask about algorithms..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    style={styles.input}
                />
                <button type="submit" style={styles.sendBtn} disabled={loading}>
                    <Send size={18} color="var(--accent-primary)" />
                </button>
            </form>
        </div>
    );
};

const styles = {
    launcher: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: 'var(--glow-shadow)'
    },
    chatWindow: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
        zIndex: 1000,
    },
    header: {
        padding: '15px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px'
    },
    messageArea: {
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    messageBubble: {
        padding: '10px 15px',
        borderRadius: '15px',
        maxWidth: '80%',
        lineHeight: '1.4',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-body)'
    },
    inputArea: {
        padding: '15px',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        gap: '10px',
        background: 'rgba(0,0,0,0.2)'
    },
    input: {
        flex: 1,
        padding: '10px',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontFamily: 'var(--font-body)'
    },
    sendBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default Chatbot;
