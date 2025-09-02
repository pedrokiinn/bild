// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
