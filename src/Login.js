import React, { useState, useEffect } from "react";
import { auth } from "./firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const userUID = localStorage.getItem("userUID");
    if (userUID) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Store UID locally to use in app
      localStorage.setItem("userUID", uid);

      // Navigate after successful login
      navigate("/dashboard");
    } catch (err) {
      // Better error handling: Provide user-friendly message
      alert("Login Failed: Invalid email or password. Please try again.");
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
