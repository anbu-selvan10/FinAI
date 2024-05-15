import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCBgbKptLLip_rN4pHSWnCxsdIW8_mvdfU",
    authDomain: "finai-fff2.firebaseapp.com",
    projectId: "finai-fff2",
    storageBucket: "finai-fff2.appspot.com",
    messagingSenderId: "556153669624",
    appId: "1:556153669624:web:37d404cab1c7dd0ab1780d",
    measurementId: "G-EJG7JE3JYJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app, db };
