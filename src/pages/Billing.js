import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import Quagga from 'quagga'; // Barcode scanner
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas'; // PDF export
import { jsPDF } from 'jspdf'; // PDF
import * as XLSX from 'xlsx'; // Excel

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalTabs, setTotalTabs] = useState(0);
  const [totalSyrups, setTotalSyrups] = useState(0);
  const [totalInjections, setTotalInjections] = useState(0);
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

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: barcodeRef.current,
        constraints: { facingMode: "environment" }
      },
      decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"] }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      const scannedBarcode = data.codeResult.code;
      const product = products.find(p => p.barcode === scannedBarcode);
      if (product) addToCart(product);
    });

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${datePart}-${randomPart}`);
  }, [products]);

  const updateTotals = (updatedCart) => {
    let total = 0, tabs = 0, syrups = 0, injections = 0;

    updatedCart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const category = item.category?.toLowerCase() || '';
      if (category.includes('tab')) tabs += itemTotal;
      else if (category.includes('syrup')) syrups += itemTotal;
      else if (category.includes('inj')) injections += itemTotal;
    });

    setTotal(total);
    setTotalTabs(tabs);
    setTotalSyrups(syrups);
    setTotalInjections(injections);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    let updatedCart;

    if (existing) {
      updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1, unitType: 'pack' }];
    }

    setCart(updatedCart);
    updateTotals(updatedCart);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleQuantityChange = (id, newQty) => {
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: parseInt(newQty) || 0 } : item
    );
    setCart(updatedCart);
    updateTotals(updatedCart);
  };

  const handleUnitTypeChange = (id, unitType) => {
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, unitType } : item
    );
    setCart(updatedCart);
  };

  const handleRemoveItem = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    updateTotals(updatedCart);
  };

  const updateInventoryAfterSale = async (item) => {
    const itemRef = doc(db, 'inventory', item.id);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) return;

    const data = itemSnap.data();
    let updatedFields = {};
    const category = (data.category || '').toLowerCase();
    const quantitySold = item.quantity;

    if (item.unitType === 'unit') {
      if (category.includes('tab') && data.tabletsPerStrip) {
        const currentRemainingTabs = data.remainingTabs || 0;
        let newRemainingTabs = currentRemainingTabs - quantitySold;
        let stripsToDeduct = 0;
        while (newRemainingTabs < 0 && (data.quantity - stripsToDeduct) > 0) {
          stripsToDeduct++;
          newRemainingTabs += data.tabletsPerStrip;
        }
        updatedFields.remainingTabs = Math.max(newRemainingTabs, 0);
        updatedFields.quantity = Math.max((data.quantity || 0) - stripsToDeduct, 0);
      } else if (category.includes('inj') && data.vialsPerPack) {
        const currentRemainingVials = data.remainingVials || 0;
        let newRemainingVials = currentRemainingVials - quantitySold;
        let packsToDeduct = 0;
        while (newRemainingVials < 0 && (data.quantity - packsToDeduct) > 0) {
          packsToDeduct++;
          newRemainingVials += data.vialsPerPack;
        }
        updatedFields.remainingVials = Math.max(newRemainingVials, 0);
        updatedFields.quantity = Math.max((data.quantity || 0) - packsToDeduct, 0);
      }
    } else {
      updatedFields.quantity = Math.max((data.quantity || 0) - quantitySold, 0);
    }

    await updateDoc(itemRef, updatedFields);
  };

  const handleCheckout = async () => {
  try {
    // Add customer to 'customers' collection
    const customerRef = await addDoc(collection(db, 'customers'), customerInfo);

    const saleDate = new Date();
    const saleTimestamp = saleDate.toISOString();
    const monthKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`; // e.g., "2025-04"

    // Record full sale to 'sales' collection
    const saleData = {
      invoiceNumber,
      products: cart,
      totalAmount: total,
      totalTabs,
      totalSyrups,
      totalInjections,
      date: saleTimestamp,
      customerId: customerRef.id,
      customerName: customerInfo.name || '',
    };

    await addDoc(collection(db, 'sales'), saleData);

    // Update inventory
    for (const item of cart) {
      await updateInventoryAfterSale(item);
    }

    // === NEW: Add to Monthly Report ===
    const monthlyReportRef = doc(db, 'monthlyReports', monthKey);
    const monthlySnapshot = await getDoc(monthlyReportRef);

    if (monthlySnapshot.exists()) {
      // If a report already exists for this month, update its totals
      await updateDoc(monthlyReportRef, {
        totalSales: increment(total),
        totalTabs: increment(totalTabs),
        totalSyrups: increment(totalSyrups),
        totalInjections: increment(totalInjections),
        numberOfSales: increment(1),
      });
    } else {
      // If no report exists yet, create one
      await setDoc(monthlyReportRef, {
        totalSales: total,
        totalTabs: totalTabs,
        totalSyrups: totalSyrups,
        totalInjections: totalInjections,
        numberOfSales: 1,
        month: monthKey,
        createdAt: saleTimestamp,
      });
    }

    // Reset billing states
    alert('Sale complete!');
    setCart([]);
    setTotal(0);
    setTotalTabs(0);
    setTotalSyrups(0);
    setTotalInjections(0);
    setCustomerInfo({ name: '', phone: '', address: '' });

  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Something went wrong during checkout. Please try again.");
  }
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
      <input value={searchQuery} onChange={handleSearchChange} placeholder="Search product..." />
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
              <th>Category</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Unit Type</th>
              <th>Total</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || '-'}</td>
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
                <td>
                  <select value={item.unitType} onChange={e => handleUnitTypeChange(item.id, e.target.value)}>
                    <option value="pack">Pack</option>
                    <option value="unit">Unit</option>
                  </select>
                </td>
                <td>${item.price * item.quantity}</td>
                <td><button onClick={() => handleRemoveItem(item.id)}>X</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Total: ${total}</h4>
        <p>Tablets: ${totalTabs} | Syrups: ${totalSyrups} | Injections: ${totalInjections}</p>
        <QRCodeCanvas value={invoiceNumber} size={100} style={{ marginTop: '10px' }} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Customer Info</h3>
        <input type="text" name="name" placeholder="Customer Name" value={customerInfo.name} onChange={handleCustomerInfoChange} />
        <input type="text" name="phone" placeholder="Customer Phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} />
        <input type="text" name="address" placeholder="Customer Address" value={customerInfo.address} onChange={handleCustomerInfoChange} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleCheckout}>Checkout</button>
        <button onClick={exportToPDF}>Download PDF</button>
        <button onClick={exportToExcel}>Download Excel</button>
        <button onClick={() => window.print()}>Print Bill</button>
      </div>

      <div ref={barcodeRef} style={{ marginTop: '20px' }}>
        {/* Barcode scanner live feed here */}
      </div>
    </div>
  );
};

export default Billing;
