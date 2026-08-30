import { initializeApp } from "firebase/app";
import { getDatabase, ref, query, orderByChild, get, push, set, serverTimestamp } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAdJGVvGIYWp7QqTuJJSW0gUSrUrmvJzqg",
    authDomain: "linear-and-binary-search.firebaseapp.com",
    projectId: "linear-and-binary-search",
    databaseURL: "https://linear-and-binary-search-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "linear-and-binary-search.firebasestorage.app",
    messagingSenderId: "434237982824",
    appId: "1:434237982824:web:43987629e43e72547753dd"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function testFirebase() {
    try {
        console.log("Testing read...");
        const chatRef = ref(database, 'chat_logs');
        const chatQuery = query(chatRef, orderByChild('timestamp'));
        const snapshot = await get(chatQuery);
        console.log("Read successful! Exists:", snapshot.exists());

        console.log("Testing write...");
        const newLogRef = push(chatRef);
        await set(newLogRef, {
            user: "TestUser",
            userMessage: "Test",
            botResponse: "TestResponse",
            timestamp: serverTimestamp()
        });
        console.log("Write successful!");
    } catch (error) {
        console.error("Firebase Error:", error.code, error.message);
    }
    process.exit(0);
}

testFirebase();
