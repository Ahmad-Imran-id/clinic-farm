import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const App = () => {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicine, setMedicine] = useState([]);
  
  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error: ", error);
    }
  };

  const handleSignup = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Signup error: ", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const addPatient = async (patientData) => {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'patients'), { uid: user.uid, ...patientData });
    }
  };

  const addMedicine = async (medicineData) => {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'inventory'), { uid: user.uid, ...medicineData });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const patientsSnapshot = await getDocs(query(collection(db, 'patients'), where('uid', '==', user.uid)));
        setPatients(patientsSnapshot.docs.map(doc => doc.data()));

        const medicineSnapshot = await getDocs(query(collection(db, 'inventory'), where('uid', '==', user.uid)));
        setMedicine(medicineSnapshot.docs.map(doc => doc.data()));
      };
      fetchData();
    }
  }, [user]);

  return (
    <div className="App">
      {user ? (
        <div>
          <h1>Welcome {user.email}</h1>
          <button onClick={handleLogout}>Logout</button>

          <h2>Add Patient</h2>
          <button onClick={() => addPatient({ name: "John Doe", age: 30, gender: "Male", diagnosis: "Flu" })}>Add Patient</button>

          <h2>Add Medicine</h2>
          <button onClick={() => addMedicine({ medicine_name: "Aspirin", quantity: 50, expiry_date: "2025-12-31", supplier: "Pharma Corp" })}>Add Medicine</button>

          <h2>Patients</h2>
          <ul>
            {patients.map((patient, index) => (
              <li key={index}>{patient.name}</li>
            ))}
          </ul>

          <h2>Medicine</h2>
          <ul>
            {medicine.map((med, index) => (
              <li key={index}>{med.medicine_name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h2>Login</h2>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button onClick={() => handleLogin("email@example.com", "password123")}>Login</button>

          <h2>Signup</h2>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button onClick={() => handleSignup("newuser@example.com", "password123")}>Signup</button>
        </div>
      )}
    </div>
  );
}

export default App;

