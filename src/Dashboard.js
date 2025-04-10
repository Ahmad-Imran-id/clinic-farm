import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase-config";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { exportToExcel } from "./utils/exportToExcel";

function Dashboard() {
  const [stock, setStock] = useState([]);
  const [product, setProduct] = useState({ name: "", quantity: 0 });

  const loadStock = async () => {
    const stockRef = collection(db, "stock");
    const data = await getDocs(stockRef);
    setStock(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const addOrUpdateStock = async () => {
    const existing = stock.find((item) => item.name === product.name);
    if (existing) {
      const updatedDoc = doc(db, "stock", existing.id);
      await updateDoc(updatedDoc, { quantity: existing.quantity + Number(product.quantity) });
    } else {
      await addDoc(collection(db, "stock"), product);
    }
    setProduct({ name: "", quantity: 0 });
    loadStock();
  };

  const recordSale = async (item) => {
    const updatedDoc = doc(db, "stock", item.id);
    if (item.quantity > 0) {
      await updateDoc(updatedDoc, { quantity: item.quantity - 1 });
      await addDoc(collection(db, "sales"), {
        product: item.name,
        quantity: 1,
        time: new Date().toISOString(),
        user: auth.currentUser.email,
      });
    }
    loadStock();
  };

  useEffect(() => {
    loadStock();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <input
        type="text"
        placeholder="Product Name"
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={product.quantity}
        onChange={(e) => setProduct({ ...product, quantity: e.target.value })}
      />
      <button onClick={addOrUpdateStock}>Add/Update Stock</button>

      <h3>Inventory</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Name</th><th>Quantity</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td><td>{item.quantity}</td>
              <td><button onClick={() => recordSale(item)}>Sell</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => exportToExcel(stock, "inventory")}>Download Excel</button>
    </div>
  );
}

export default Dashboard;
