// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcTCTzVAHZFyCZH5wiL0f8bpZVwy-gG4o",
  authDomain: "clinic-farm.firebaseapp.com",
  projectId: "clinic-farm",
  storageBucket: "clinic-farm.firebasestorage.app",
  messagingSenderId: "914634948650",
  appId: "1:914634948650:web:0cd9c9dd7b59a6995a0353",
  measurementId: "G-CX0SHLQ8MW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
