// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWdh2PxShX7u8SKbbmxdP5zs8AYr31kcI",
  authDomain: "carcheck-gkeh4.firebaseapp.com",
  databaseURL: "https://carcheck-gkeh4-default-rtdb.firebaseio.com",
  projectId: "carcheck-gkeh4",
  storageBucket: "carcheck-gkeh4.appspot.com",
  messagingSenderId: "886519139268",
  appId: "1:886519139268:web:04140f3c22c85be986f291",
  measurementId: "G-YB09K8E6X3"
};

// Initialize Firebase and export the services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
