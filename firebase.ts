
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1SIAwpFuoq2V2IAV8GO4KZeFZ8Cz-ddY",
  authDomain: "sms-rewards-app.firebaseapp.com",
  databaseURL: "https://sms-rewards-app-default-rtdb.firebaseio.com",
  projectId: "sms-rewards-app",
  storageBucket: "sms-rewards-app.firebasestorage.app",
  messagingSenderId: "869305185430",
  appId: "1:869305185430:web:36ae3fc34116aa8a057eb7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
