// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBeNTAFx5-yB_-G41yHhwUhK3KXXvGCUWw",
  authDomain: "anzeguard-7fc22.firebaseapp.com",
  projectId: "anzeguard-7fc22",
  storageBucket: "anzeguard-7fc22.firebasestorage.app",
  messagingSenderId: "1094938881110",
  appId: "1:1094938881110:web:cf9198637317440c2ddff7",
  measurementId: "G-SY0HQ3BNRP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);