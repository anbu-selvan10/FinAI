import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtR5WsFtdGOjE6NyahQfIKe21NqLt5EiY",
  authDomain: "finai-fff.firebaseapp.com",
  projectId: "finai-fff",
  storageBucket: "finai-fff.appspot.com",
  messagingSenderId: "362161681127",
  appId: "1:362161681127:web:cf39005462950874dae842",
  measurementId: "G-8KR7XL92L3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app, db };
