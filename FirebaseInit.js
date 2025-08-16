// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzSs3YTWt8TsFQ0KQKGgpqp2WgfrQP9Kc",
  authDomain: "icachackathon.firebaseapp.com",
  projectId: "icachackathon",
  storageBucket: "icachackathon.firebasestorage.app",
  messagingSenderId: "158234091257",
  appId: "1:158234091257:web:de1b777150e0b796f88c28",
  measurementId: "G-DEZW1NZDJZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Only enable Analytics in browser environments to avoid Node.js errors
let analytics = null;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // Ignore analytics errors in non-browser contexts
  }
}

// Log a simple confirmation when run via Node.js
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('FirebaseInit.js')) {
  console.log('Firebase initialized for project:', firebaseConfig.projectId);
}

export { app, analytics };