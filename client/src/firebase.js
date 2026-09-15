import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAsBGMiuzXh1W19xxhChn8q_u3zkai_De8",
  authDomain: "huddle-23f3c.firebaseapp.com",
  projectId: "huddle-23f3c",
  storageBucket: "huddle-23f3c.firebasestorage.app",
  messagingSenderId: "314519081976",
  appId: "1:314519081976:web:2f4b31779c0aeb0c96fc0d",
  measurementId: "G-CWTXDVK8ZE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);