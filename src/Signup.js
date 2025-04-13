import React, { useState } from "react";
import { auth, db } from "./firebase-config";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState(""); // for staff linking
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // admin or staff
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine admin UID to associate with data
      let associatedAdminUID = user.uid;
      if (role === "staff") {
        // Lookup admin by email
       const adminQuery = query(
  collection(db, "users"),
  where("email", "==", adminEmail),
  where("role", "==", "admin")
);
const querySnapshot = await getDocs(adminQuery);

if (querySnapshot.empty) {
  alert("Admin account not found.");
  return;
}
const adminDoc = querySnapshot.docs[0];
associatedAdminUID = adminDoc.data().uid;
      }

      // Save user info
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        adminUID: associatedAdminUID,
        createdAt: serverTimestamp()
      });

      // If new admin, create their data root
      if (role === "admin") {
        await setDoc(doc(db, "adminData", user.uid), {
          name,
          createdAt: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (err) {
      alert("Signup Failed: " + err.message);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)} />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
      </select>

      {role === "staff" && (
        <input
          type="email"
          placeholder="Admin Email"
          onChange={(e) => setAdminEmail(e.target.value)}
        />
      )}

      <button onClick={handleSignup}>Create Account</button>
    </div>
  );
}

export default Signup;
