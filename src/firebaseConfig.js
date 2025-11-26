// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBn3otnFDtySDsHQK8fzD_yJqKPdONKKsY",
  authDomain: "chamadosti-501e8.firebaseapp.com",
  projectId: "chamadosti-501e8",
  storageBucket: "chamadosti-501e8.firebasestorage.app",
  messagingSenderId: "125531522166",
  appId: "1:125531522166:web:9bf465b592b1096705cb57",
  measurementId: "G-T3Q35F6753"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app); // <--- ADICIONE
const analytics = getAnalytics(app);

export { app, messaging }; // <--- ATUALIZE O EXPORT