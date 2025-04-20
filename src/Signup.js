import React, { useState } from "react";
import { auth, db } from "./firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let associatedAdminUID = user.uid;

      if (role === "staff") {
        // Find admin doc by email
        const adminQuery = doc(db, "users", user.uid); // Use new user's UID temporarily
        const adminDocs = await getDocs(collection(db, "users"));
        const matchedAdmin = adminDocs.docs.find(
          (doc) => doc.data().email === adminEmail && doc.data().role === "admin"
        );

        if (!matchedAdmin) {
          alert("Admin not found for this email.");
          return;
        }

        associatedAdminUID = matchedAdmin.data().uid;
      }

      // ✅ Store user document under their UID
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        adminUID: associatedAdminUID,
        createdAt: serverTimestamp(),
      });

      if (role === "admin") {
        await setDoc(doc(db, "adminData", user.uid), {
          name,
          createdAt: serverTimestamp(),
        });
      }

      // 🔁 Slight delay to let role info propagate before ProtectedRoute checks it
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
