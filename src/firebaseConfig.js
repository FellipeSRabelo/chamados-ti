import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging"; // <--- ESTA LINHA ESTAVA FALTANDO OU INCORRETA

const firebaseConfig = {
  apiKey: "AIzaSyBn3otnFDtySDsHQK8fzD_yJqKPdONKKsY",
  authDomain: "chamadosti-501e8.firebaseapp.com",
  projectId: "chamadosti-501e8",
  storageBucket: "chamadosti-501e8.firebasestorage.app",
  messagingSenderId: "125531522166",
  appId: "1:125531522166:web:9bf465b592b1096705cb57",
  measurementId: "G-T3Q35F6753"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app); // <--- ADICIONE
const analytics = getAnalytics(app);

export { app, messaging }; // <--- ATUALIZE O EXPORT