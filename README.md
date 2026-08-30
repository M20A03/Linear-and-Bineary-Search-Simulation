# 🚀 Space Explorer • Linear & Binary Search Simulation

[![Live Demo](https://img.shields.io/badge/Live_Demo-Firebase_Hosting-0077B6?style=for-the-badge&logo=firebase)](https://linear-and-binary-search.web.app)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-38EF7D?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)

An enterprise-grade, gamified, and interactive Data Structures & Algorithms simulation platform designed to teach **Linear Search** and **Binary Search** through immersive space-themed and real-world scenarios.

---

## 🌐 Live Application
* **Production URL:** [https://linear-and-binary-search.web.app](https://linear-and-binary-search.web.app)
* **GitHub Repository:** [https://github.com/M20A03/Linear-and-Bineary-Search-Simulation](https://github.com/M20A03/Linear-and-Bineary-Search-Simulation)

---

## 🎯 Key Features & Simulation Modes

### 1. 🔍 Search Algorithms
* **Linear Search ($\mathcal{O}(n)$):** Sequential sector-by-sector scan ideal for unsorted, chaotic data.
* **Binary Search ($\mathcal{O}(\log n)$):** Hyperspace jump protocol that halves the search space at each iteration on sorted arrays.

### 2. 🌌 3 Interactive Scenarios
* **Space Fleet Radar:** Scan numeric power levels of alien warships in combat space.
* **Contacts Directory:** Real-world scenario searching through alphabetical contact names.
* **Attendance Roll Sheet:** Educational scenario locating student roll numbers in sorted vs. unsorted class sheets.

### 3. 🎨 Zero-FOUC Adaptive Theme System
* **Nebula (Night Mode):** High-contrast cyberpunk palette with custom starfield overlays.
* **Solar (Day Mode):** Eye-safe daylight palette calibrated for contrast and readability.
* **Zero Flash of Unstyled Content (Zero-FOUC):** Synchronous `<head>` inline script ensures correct theme rendering before first paint.
* **Dynamic Meta Theme Color:** Auto-syncs browser address bars on iOS Safari and Android Chrome.

### 4. 🔊 Synthesized WebAudio SFX
* Built-in oscillator synthesizer producing custom sci-fi audio effects for UI interactions, mission success chimes, and scan pulses with zero external audio assets.

### 5. 🤖 Star-Command AI Assistant
* Embedded conversational chatbot answering DSA questions, explaining complexity tradeoffs, and guiding learners through real-life search applications.

### 6. 📱 Enterprise Cross-Platform UX (320px – 4K UHD)
* **Mobile Safe-Area Compliance:** `viewport-fit=cover` and `env(safe-area-inset-*)` support.
* **iOS Safari Auto-Zoom Prevention:** Form fields locked to $16\text{px}$ minimum font size.
* **Touch Targets:** Minimum $44\times 44\text{px}$ hit bounding boxes meeting Apple HIG and WCAG 2.5.8.
* **Responsive Density Scaling:** 1-column mobile drawer, 2-column tablet, 3-column laptop, and 4/5-column workstation grid density.

### 7. ⌨️ Global Keyboard Accessibility
* <kbd>Alt</kbd> + <kbd>T</kbd> — Quick toggle between Solar and Nebula themes.
* <kbd>Escape</kbd> — Dismiss open drawers, modals, and palettes.
* <kbd>Tab</kbd> — High-visibility WCAG focus rings on all interactive elements.

---

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated CI/CD pipeline for GitHub Actions
├── .gitignore                      # Global git ignores
├── README.md                       # Repository documentation
├── search_visualizer.py            # Standalone Python CLI simulation engine
└── Space-Explorer-Visualizer/      # Full-stack web application
    ├── backend/
    │   ├── database.py             # SQLite persistence layer
    │   ├── main.py                 # FastAPI backend server
    │   └── requirements.txt        # Python backend dependencies
    ├── public/
    │   └── logo.png                # Platform branding
    ├── src/
    │   ├── components/
    │   │   ├── Auth.jsx            # Idempotent Firebase Auth (Email & Password)
    │   │   ├── Carousel.jsx        # Mission selector carousel
    │   │   ├── Chatbot.jsx         # AI chat assistant
    │   │   ├── ErrorBoundary.jsx   # Root error boundary with telemetry
    │   │   ├── Navbar.jsx          # Mobile drawer & accessible navigation
    │   │   └── Visualizer.jsx      # Core visual algorithm engine
    │   ├── context/
    │   │   └── ThemeContext.jsx    # Theme provider with WebAudio synthesizer
    │   ├── hooks/
    │   │   ├── useBreakpoint.js    # Reactive viewport detection hook
    │   │   └── useKeyboardShortcut.js # Global keyboard listener
    │   ├── lib/
    │   │   └── fetcher.js          # Resilient fetch with exponential backoff
    │   ├── pages/
    │   │   └── Home.jsx            # Mission database landing dashboard
    │   ├── App.jsx                 # Route guards & global layout
    │   ├── firebase.js             # Firebase SDK client initialization
    │   ├── index.css               # Design tokens, CSS reset, & safe area insets
    │   └── main.jsx                # Application root entrypoint
    ├── firebase.json               # Firebase Hosting & RTDB rules
    ├── index.html                  # HTML entrypoint with zero-FOUC script
    ├── package.json                # Frontend dependencies & scripts
    └── vite.config.js              # Vite build configuration
```

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v18.0 or higher
* **npm**: v9.0 or higher
* **Python**: v3.10 or higher (optional, for FastAPI backend)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/M20A03/Linear-and-Bineary-Search-Simulation.git
cd Linear-and-Bineary-Search-Simulation
```

---

### Step 2: Start the Frontend (Vite + React)
```bash
cd Space-Explorer-Visualizer
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### Step 3: (Optional) Start the Python Backend
```bash
cd Space-Explorer-Visualizer/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

---

## 🚢 Building & Deployment

### Build for Production
```bash
cd Space-Explorer-Visualizer
npm run build
```

### Deploy to Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
