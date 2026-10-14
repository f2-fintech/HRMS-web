import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAU8uuKcwZtLkeIAb7T_wT3WKoq8080OYU",
  authDomain: "trustapp-4d70a.firebaseapp.com",
  projectId: "trustapp-4d70a",
  storageBucket: "trustapp-4d70a.firebasestorage.app",
  messagingSenderId: "715671287026",
  appId: "1:715671287026:web:4f78b42439d2a0cf21cc6b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

console.log("FIREBASE CONFIG LOADED");
console.log(auth);
