import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAdJGVvGIYWp7QqTuJJSW0gUSrUrmvJzqg",
    authDomain: "linear-and-binary-search.firebaseapp.com",
    projectId: "linear-and-binary-search",
    databaseURL: "https://linear-and-binary-search-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "linear-and-binary-search.firebasestorage.app",
    messagingSenderId: "434237982824",
    appId: "1:434237982824:web:43987629e43e72547753dd",
    measurementId: "G-7SK9GFQ11Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
