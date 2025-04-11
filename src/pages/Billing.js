import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [total, setTotal] = useState(0);
  const billRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  const updateTotal = (updatedCart) => {
    const total = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(total);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(updatedCart);
    updateTotal(updatedCart);
    setSearchQuery('');
    setSuggestions([]);
  };

  const [invoiceNumber, setInvoiceNumber] = useState('');

useEffect(() => {
  const generateInvoiceNumber = () => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `INV-${datePart}-${randomPart}`;
  };
  setInvoiceNumber(generateInvoiceNumber());
}, []);

  
  const handleCheckout = async () => {
    await addDoc(collection(db, 'sales'), {
      products: cart,
      totalAmount: total,
      date: new Date().toISOString(),
    });

    for (const item of cart) {
      const itemRef = doc(db, 'inventory', item.id);
      await updateDoc(itemRef, {
        quantity: item.quantity - 1,
      });
    }

    alert('Sale complete!');
    setCart([]);
    setTotal(0);
  };

  const exportToPDF = () => {
    html2canvas(billRef.current).then(canvas => {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10);
      pdf.save('bill.pdf');
    });
  };

  const handleSearchChange = e => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value) {
      const filtered = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Billing</h2>
      <div>
        <input value={searchQuery} onChange={handleSearchChange} placeholder="Search product..." />
        <ul>
          {suggestions.map(p => (
            <li key={p.id} onClick={() => addToCart(p)} style={{ cursor: 'pointer' }}>
              {p.name}
            </li>
          ))}
        </ul>
      </div>

      <div id="bill-print-area" ref={billRef}>
  <h3>Invoice Number: {invoiceNumber}</h3>
  <h3>Cart</h3>
  <ul>
    {cart.map(item => (
      <li key={item.id}>
        {item.name} - {item.quantity} x ${item.price} = ${item.quantity * item.price}
      </li>
    ))}
  </ul>
  <h4>Total: ${total}</h4>
</div>


      <button onClick={handleCheckout}>Checkout</button>
      <button onClick={exportToPDF}>Download PDF</button>
      <button onClick={handleCheckout}>Checkout</button>
      <button onClick={exportToPDF}>Download PDF</button>
      <button onClick={() => window.print()}>Print Bill</button>

    </div>
  );
};

export default Billing;
