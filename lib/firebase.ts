import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- CONFIGURAÇÃO DO EMULADOR ---
// Verifica se estamos em ambiente de desenvolvimento (Next.js)
if (process.env.NODE_ENV === "development") {
  // Conecta ao Auth Emulator (porta 9099 conforme seu firebase.json)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

  // Conecta ao Firestore Emulator (porta 8080 conforme seu firebase.json)
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default app;