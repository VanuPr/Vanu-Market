
// Firebase SDK imports
import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5FNJt-kK5HiFtb0XRbmmcyJkaRAGaam8",
  authDomain: "vanu-oragnic-pvt-ltd.firebaseapp.com",
  projectId: "vanu-oragnic-pvt-ltd",
  storageBucket: "vanu-oragnic-pvt-ltd.appspot.com",
  messagingSenderId: "1041826459372",
  appId: "1:1041826459372:web:2138e7477ecbaf835a3fc9",
  measurementId: "G-1DPH9N8L6S"
};

// Initialize main app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Creates a temporary secondary Firebase app instance for isolated operations
 * Useful for background auth or isolated logic
 */
const createSecondaryApp = (): { tempApp: FirebaseApp, tempAuth: Auth } => {
  const secondaryAppName = `secondary-app-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, secondaryAppName);
  const tempAuth = getAuth(tempApp);
  return { tempApp, tempAuth };
};

// Exporting instances for external use
export {
  app,
  auth,
  db,
  storage,
  googleProvider,
  createSecondaryApp
};
