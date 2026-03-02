// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIFMb90v2ATUPDNz0DU4Kc-7gpHANqi34",
  authDomain: "internarea-58e1f.firebaseapp.com",
  projectId: "internarea-58e1f",
  storageBucket: "internarea-58e1f.firebasestorage.app",
  messagingSenderId: "30890716342",
  appId: "1:30890716342:web:cc4a1ff28cfa4942ad0a17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };