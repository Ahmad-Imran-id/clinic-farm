// src/Signup.js
import React, { useState } from "react";
import { auth, db } from "./firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState(""); // only for staff
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // admin or staff
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let associatedAdminUID = user.uid;

      if (role === "staff") {
        const adminDocRef = doc(db, "users", adminEmail);
        const adminDocSnap = await getDoc(adminDocRef);

        if (!adminDocSnap.exists()) {
          alert("Admin not found.");
          return;
        }

        associatedAdminUID = adminDocSnap.data().uid;
      }

      // Create Firestore user doc
      await setDoc(doc(db, "users", user.email), {
        uid: user.uid,
        name,
        email,
        role,
        adminUID: associatedAdminUID,
        createdAt: serverTimestamp(),
      });

      // Optional: initialize admin data tree
      if (role === "admin") {
        await setDoc(doc(db, "adminData", user.uid), {
          name,
          createdAt: serverTimestamp(),
        });
      }

      // ✅ Allow time for role to sync to Firestore before routing
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Sign Up</h2>
      <input
        type="text"
        placeholder="Full Name"
        className="form-control my-2"
        onChange={(e) => setName(e.target.value)}
      />
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

      <select
        value={role}
        className="form-select my-2"
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
      </select>

      {role === "staff" && (
        <input
          type="email"
          className="form-control my-2"
          placeholder="Admin's Email"
          onChange={(e) => setAdminEmail(e.target.value)}
        />
      )}

      <button className="btn btn-primary mt-2" onClick={handleSignup}>
        Create Account
      </button>
    </div>
  );
}

export default Signup;
