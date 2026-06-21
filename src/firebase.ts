import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5SBQUvGnrKntoRcg5YNf6o46kB-qeCE4",
  authDomain: "yondy-web-prospect-b291a.firebaseapp.com",
  projectId: "yondy-web-prospect-b291a",
  storageBucket: "yondy-web-prospect-b291a.firebasestorage.app",
  messagingSenderId: "1080893455710",
  appId: "1:1080893455710:web:f0c11c80a9a4dd32c123cf"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
