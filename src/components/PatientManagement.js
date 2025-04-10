import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase-config'; // Correct the path
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ name: '', age: '', condition: '' });
  const [editingId, setEditingId] = useState(null);

  const patientCollectionRef = collection(db, 'patients');

  useEffect(() => {
    const fetchPatients = async () => {
      const data = await getDocs(patientCollectionRef);
      setPatients(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, age, condition } = formData;

    const existingPatientQuery = query(
      patientCollectionRef,
      where('name', '==', name),
      where('age', '==', age)
    );
    const snapshot = await getDocs(existingPatientQuery);

    if (!snapshot.empty) {
      // Merge data
      const patientDoc = snapshot.docs[0];
      const docRef = doc(db, 'patients', patientDoc.id);
      await updateDoc(docRef, { condition });
    } else {
      // Add new
      await addDoc(patientCollectionRef, { name, age, condition });
    }

    setFormData({ name: '', age: '', condition: '' });
    window.location.reload();
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, 'patients', id);
    await deleteDoc(docRef);
    setPatients(patients.filter(p => p.id !== id));
  };

  const handleEdit = (patient) => {
    setFormData({ name: patient.name, age: patient.age, condition: patient.condition });
    setEditingId(patient.id);
  };

  const handleUpdate = async () => {
    const docRef = doc(db, 'patients', editingId);
    await updateDoc(docRef, formData);
    setEditingId(null);
    setFormData({ name: '', age: '', condition: '' });
    window.location.reload();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Patient Management</h2>

      <form onSubmit={editingId ? handleUpdate : handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Condition"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          {editingId ? 'Update' : 'Add Patient'}
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Age</th>
            <th className="p-2 border">Condition</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="border p-2">{patient.name}</td>
              <td className="border p-2">{patient.age}</td>
              <td className="border p-2">{patient.condition}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(patient)}
                  className="bg-yellow-400 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(patient.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientManagement;
