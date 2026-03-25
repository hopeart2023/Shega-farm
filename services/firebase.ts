
import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";

/**
 * Replace the values below with your actual Firebase Project Configuration.
 * You can find this in your Firebase Console -> Project Settings -> General.
 */
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "shega-farm.firebaseapp.com",
  projectId: "shega-farm",
  storageBucket: "shega-farm.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Direct collection references for consistency
export const profilesCol = collection(db, "profiles");
export const diagnosesCol = collection(db, "diagnoses");
export const marketCol = collection(db, "market_listings");
export const forumCol = collection(db, "forum_questions");
export const alertsCol = collection(db, "alerts");
