import React, { useState } from "react";
import { auth, db } from "./firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Make sure role exists before redirect
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        alert("User role not found in database.");
        return;
      }

      const role = userDocSnap.data().role;

      // Redirect based on role (optional)
      navigate("/dashboard");
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        className="form-control my-2"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="form-control my-2"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn btn-primary" onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
