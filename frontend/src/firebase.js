import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHM9KkOsRx5ieB6TaUE0dYKhQF1eydJs0",
  authDomain: "rakshanetra-74a52.firebaseapp.com",
  databaseURL:
    "https://rakshanetra-74a52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rakshanetra-74a52",
  storageBucket: "rakshanetra-74a52.firebasestorage.app",
  messagingSenderId: "236926931806",
  appId: "1:236926931806:web:633cc1ed9126125615b5cf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
