import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDrN1DPLTSu_xpPSlP4ovckZc4RZ8K3occ",
    authDomain: "hijab-app-auth.firebaseapp.com",
    projectId: "hijab-app-auth",
    storageBucket: "hijab-app-auth.firebasestorage.app",
    messagingSenderId: "572621061810",
    appId: "1:572621061810:web:8f6007e9b3729157e153ab",
    measurementId: "G-8J8RB18C6J"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
