// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYeO9aUm4bSpKY42N2cds4WLuiOtV6pTE",
  authDomain: "online-job-portal-3db4c.firebaseapp.com",
  projectId: "online-job-portal-3db4c",
  storageBucket: "online-job-portal-3db4c.firebasestorage.app",
  messagingSenderId: "5860098505",
  appId: "1:5860098505:web:a9835dc415cfb0ecd7a818",
  measurementId: "G-QZ7DBH3N8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const fireDB = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export {fireDB, auth,storage}