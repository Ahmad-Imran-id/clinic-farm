import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from './firebase-config'; // Firebase configuration

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

function App() {
  const [user, setUser] = useState(null);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: '', diagnosis: '' });
  const [patients, setPatients] = useState([]);
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup forms

  // Firebase Authentication state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Handle Sign-Up
  const signUpUser = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;

    try {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      setIsSignUp(false); // Switch to login form after successful sign-up
    } catch (error) {
      alert('Sign-up failed: ' + error.message);
    }
  };

  // Handle Login
  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;

    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  // Handle Logout
  const logoutUser = async () => {
    await signOut(auth);
  };

  // Add Patient Data
  const addPatient = async (e) => {
    e.preventDefault();
    if (user) {
      await addDoc(collection(db, 'patients'), { ...newPatient, uid: user.uid });
      setNewPatient({ name: '', age: '', gender: '', diagnosis: '' });
    } else {
      alert('You must be logged in to add a patient.');
    }
  };

  // Fetch Patients Data
  useEffect(() => {
    if (user) {
      const fetchPatients = async () => {
        const q = query(collection(db, 'patients'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        setPatients(querySnapshot.docs.map(doc => doc.data()));
      };
      fetchPatients();
    }
  }, [user]);

  return (
    <div>
      <h1>Clinic & Pharmacy Dashboard</h1>

      {/* Conditional rendering based on whether the user is signed in */}
      {!user ? (
        <div>
          {/* Toggle between login and sign-up */}
          {isSignUp ? (
            <form onSubmit={signUpUser}>
              <h2>Sign Up</h2>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Sign Up</button>
            </form>
          ) : (
            <form onSubmit={loginUser}>
              <h2>Login</h2>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Login</button>
            </form>
          )}

          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Login' : 'New here? Sign Up'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.email}</h2>
          <button onClick={logoutUser}>Logout</button>

          <form onSubmit={addPatient}>
            <h2>Add Patient</h2>
            <input
              type="text"
              placeholder="Name"
              value={newPatient.name}
              onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Age"
              value={newPatient.age}
              onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
            />
            <input
              type="text"
              placeholder="Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
            />
            <input
              type="text"
              placeholder="Diagnosis"
              value={newPatient.diagnosis}
              onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
            />
            <button type="submit">Add Patient</button>
          </form>

          <h3>Patients</h3>
          <ul>
            {patients.map((patient, index) => (
              <li key={index}>
                {patient.name} - {patient.diagnosis}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
