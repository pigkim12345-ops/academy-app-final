import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyDoNq7-HksOhRY2ekHj02z8zQU6AFCMAJM",
  authDomain: "piltop-4e627.firebaseapp.com",
  projectId: "piltop-4e627",
  storageBucket: "piltop-4e627.firebasestorage.app",
  messagingSenderId: "752580545704",
  appId: "1:752580545704:web:581f9f1d86b9717f83869d"
}

const app = initializeApp(firebaseConfig)

export default app