// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqeJchJm7_Lh4L3pJCr-Fr8N8Ou-nINHw",
  authDomain: "booking-app-b0b82.firebaseapp.com",
  projectId: "booking-app-b0b82",
  storageBucket: "booking-app-b0b82.firebasestorage.app",
  messagingSenderId: "152257870406",
  appId: "1:152257870406:web:3b04293fa350859ac4a847",
  measurementId: "G-2KDTX2ZJ6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);