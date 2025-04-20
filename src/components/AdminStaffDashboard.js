import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  setDoc
} from "firebase/firestore";
import { auth, db } from "../firebase-config";
import { Button, Form, Table, Alert } from "react-bootstrap";

const AdminStaffDashboard = ({ currentUser }) => {
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const adminUID = currentUser?.uid;

  useEffect(() => {
    if (!adminUID) return;
    const q = query(collection(db, `admins/${adminUID}/staff`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaff(staffList);
    });

    return () => unsubscribe();
  }, [adminUID]);

const handleCreateStaff = async () => {
  const { email, password, name } = newStaff;
  if (!email || !password || !name) {
    return alert("All fields are required.");
  }

  try {
    // Create staff in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const staffUID = userCredential.user.uid;

    // 🔥 Add to Firestore users collection (needed for login role detection)
    await setDoc(doc(db, "users", staffUID), {
      uid: staffUID,
      email,
      name,
      role: "staff",
      adminUID,
      createdAt: new Date().toISOString(),
    });

    // 🔥 Save under admin scope (for admin's staff list)
    await addDoc(collection(db, `admins/${adminUID}/staff`), {
      name,
      email,
      staffUID,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    setMessage("Staff account created successfully!");
    setNewStaff({ name: "", email: "", password: "" });
  } catch (err) {
    console.error("Error creating staff:", err.message);
    alert("Failed to create staff: " + err.message);
  }
};


  const toggleBlockStaff = async (staffId, isActive) => {
    const staffRef = doc(db, `admins/${adminUID}/staff`, staffId);
    await updateDoc(staffRef, {
      isActive: !isActive,
    });
  };

  const deleteStaff = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff account?")) {
      await deleteDoc(doc(db, `admins/${adminUID}/staff`, staffId));
    }
  };

  return (
    <div className="container mt-4">
      <h2>Manage Staff Accounts</h2>

      {message && <Alert variant="success">{message}</Alert>}

      <Form className="mb-4">
        <Form.Group className="mb-2">
          <Form.Control
            type="text"
            placeholder="Staff Name"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Control
            type="email"
            placeholder="Staff Email"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Control
            type="password"
            placeholder="Temporary Password"
            value={newStaff.password}
            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
          />
        </Form.Group>

        <Button onClick={handleCreateStaff}>Add Staff</Button>
      </Form>

      <h4>Staff List</h4>
      <Table bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Toggle Block</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.isActive ? "Active" : "Blocked"}</td>
              <td>
                <Button
                  variant={user.isActive ? "warning" : "success"}
                  onClick={() => toggleBlockStaff(user.id, user.isActive)}
                >
                  {user.isActive ? "Block" : "Unblock"}
                </Button>
              </td>
              <td>
                <Button variant="danger" onClick={() => deleteStaff(user.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminStaffDashboard;
