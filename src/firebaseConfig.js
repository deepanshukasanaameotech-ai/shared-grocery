import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // ✅ Import Firestore

//this is my git push and revert test and i am learning github properly so i coul duse it in my future

const firebaseConfig = {
  apiKey: "AIzaSyAAEfOsfav3ggQ4ALh8yk3FWXoy7f0POak",
  authDomain: "sharedgrocery-140ba.firebaseapp.com",
  projectId: "sharedgrocery-140ba",
  storageBucket: "sharedgrocery-140ba.firebasestorage.app",
  messagingSenderId: "908490668737",
  appId: "1:908490668737:web:f90dd9d26dd9d2fc313240",
  measurementId: "G-EC4LD8ZDST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firestore database
export const db = getFirestore(app);
