import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3Tt62sNRUwbraUKgUFZO1X_iX0agggh4",
  authDomain: "leadsmanage-1f7cd.firebaseapp.com",
  projectId: "leadsmanage-1f7cd",
  storageBucket: "leadsmanage-1f7cd.firebasestorage.app",
  messagingSenderId: "1019581568447",
  appId: "1:1019581568447:web:ee97dfa623591f017d3d0a",
  measurementId: "G-W0VN0VVW7X",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
