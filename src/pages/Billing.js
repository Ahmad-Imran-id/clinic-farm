import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'react-qr-code';
import Quagga from 'quagga';  // Barcode scanning library

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const billRef = useRef();
  const barcodeRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    };
    fetchProducts();

    // Initialize barcode scanner
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: barcodeRef.current, // video element
        constraints: {
          facingMode: "environment",
        }
      },
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
      }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      const scannedBarcode = data.codeResult.code;
      const product = products.find(p => p.barcode === scannedBarcode); // Match product by barcode
      if (product) {
        addToCart(product);
      }
    });

    // Generate Invoice Number
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${datePart}-${randomPart}`);
  }, [products]);

  const updateTotal = (updatedCart) => {
    const total = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(total);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(updatedCart);
    updateTotal(updatedCart);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleQuantityChange = (id, newQty) => {
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: parseInt(newQty) || 0 } : item
    );
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const handleRemoveItem = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const handleCheckout = async () => {
    // Save customer info in Firebase
    const customerRef = await addDoc(collection(db, 'customers'), customerInfo);

    // Save the sale with customer info linked
    await addDoc(collection(db, 'sales'), {
      invoiceNumber,
      products: cart,
      totalAmount: total,
      date: new Date().toISOString(),
      customerId: customerRef.id,  // Link to customer
    });

    // Update inventory
    for (const item of cart) {
      const itemRef = doc(db, 'inventory', item.id);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        const existingData = itemSnap.data();
        const updatedQuantity = existingData.quantity - item.quantity;
        await updateDoc(itemRef, {
          quantity: updatedQuantity >= 0 ? updatedQuantity : 0,
        });
      }
    }

    alert('Sale complete!');
    setCart([]);
    setTotal(0);
    setCustomerInfo({ name: '', phone: '', address: '' }); // Clear customer info
  };

  const exportToPDF = () => {
    html2canvas(billRef.current).then(canvas => {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10);
      pdf.save('bill.pdf');
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(cart.map(({ id, ...rest }) => rest));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bill');
    XLSX.writeFile(workbook, `${invoiceNumber}.xlsx`);
  };

  const handleSearchChange = e => {
    const value = e.target.value;
    setSearchQuery(value);
    setSuggestions(value
      ? products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
      : []);
  };

  const handleCustomerInfoChange = e => {
    const { name, value } = e.target;
    setCustomerInfo(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Billing</h2>
      <input
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search product..."
      />
      <ul>
        {suggestions.map(p => (
          <li key={p.id} onClick={() => addToCart(p)} style={{ cursor: 'pointer' }}>
            {p.name}
          </li>
        ))}
      </ul>

      <div ref={billRef} style={{ marginTop: '20px' }}>
        <h3>Invoice: {invoiceNumber}</h3>
        <table style={{ width: '100%', marginTop: '10px' }} border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>${item.price}</td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    style={{ width: '60px' }}
                  />
                </td>
                <td>${item.price * item.quantity}</td>
                <td>
                  <button onClick={() => handleRemoveItem(item.id)}>X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Total: ${total}</h4>
        <QRCode value={invoiceNumber} size={100} style={{ marginTop: '10px' }} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Customer Info</h3>
        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={customerInfo.name}
          onChange={handleCustomerInfoChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Customer Phone"
          value={customerInfo.phone}
          onChange={handleCustomerInfoChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Customer Address"
          value={customerInfo.address}
          onChange={handleCustomerInfoChange}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleCheckout}>Checkout</button>
        <button onClick={exportToPDF}>Download PDF</button>
        <button onClick={exportToExcel}>Download Excel</button>
        <button onClick={() => window.print()}>Print Bill</button>
      </div>

      <div ref={barcodeRef} style={{ marginTop: '20px' }}>
        {/* Barcode scanner will show live feed here */}
      </div>
    </div>
  );
};

export default Billing;
