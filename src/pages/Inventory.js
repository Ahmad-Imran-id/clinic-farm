import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    medicine_name: "",
    quantity: "",
    expiry_date: "",
    supplier: "",
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchInventory(currentUser.uid);
      }
    });
  }, []);

  const fetchInventory = async (uid) => {
    const q = query(collection(db, "inventory"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setInventory(data);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in");

    const existing = inventory.find(
      (item) =>
        item.medicine_name.toLowerCase() ===
        formData.medicine_name.toLowerCase()
    );

    if (existing) {
      const updatedRef = doc(db, "inventory", existing.id);
      await updateDoc(updatedRef, {
        quantity: existing.quantity + parseInt(formData.quantity),
      });
    } else {
      await addDoc(collection(db, "inventory"), {
        ...formData,
        quantity: parseInt(formData.quantity),
        uid: user.uid,
        expiry_date: new Date(formData.expiry_date),
        created_at: new Date(),
      });
    }

    setFormData({
      medicine_name: "",
      quantity: "",
      expiry_date: "",
      supplier: "",
    });

    fetchInventory(user.uid);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(inventory);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "inventory_data.xlsx");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Inventory Management</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input
          type="text"
          name="medicine_name"
          placeholder="Medicine Name"
          value={formData.medicine_name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <input
          type="date"
          name="expiry_date"
          value={formData.expiry_date}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          name="supplier"
          placeholder="Supplier"
          value={formData.supplier}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Save Medicine
        </button>
      </form>

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Current Inventory</h3>
        <button
          onClick={downloadExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download Excel
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Medicine</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">Expiry</th>
            <th className="p-2 border">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td className="p-2 border">{item.medicine_name}</td>
              <td className="p-2 border">{item.quantity}</td>
              <td className="p-2 border">
                {new Date(item.expiry_date.seconds * 1000).toLocaleDateString()}
              </td>
              <td className="p-2 border">{item.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
