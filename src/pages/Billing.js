import React, { useState } from 'react';
import { jsPDF } from "jspdf";

const Billing = () => {
  const [products, setProducts] = useState([
    { name: 'Product A', price: 10, quantity: 2 },
    { name: 'Product B', price: 20, quantity: 1 },
    { name: 'Product C', price: 5, quantity: 5 },
  ]);

  // Calculate total bill
  const calculateTotal = () => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  // Function to download the bill as a PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Invoice', 14, 22);
    
    // Product List
    doc.setFontSize(12);
    let yOffset = 30;
    products.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name} - $${product.price} x ${product.quantity}`, 14, yOffset);
      yOffset += 10;
    });

    // Total
    doc.text(`Total: $${calculateTotal()}`, 14, yOffset);

    // Save the PDF
    doc.save('invoice.pdf');
  };

  // Function to print the bill
  const printBill = () => {
    const printContent = document.getElementById('billContent');
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Invoice</title></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <h2>Billing Page</h2>
      <div id="billContent">
        <h3>Invoice</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.quantity}</td>
                <td>${product.price * product.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4>Total: ${calculateTotal()}</h4>
      </div>
      
      {/* Buttons for downloading as PDF and printing */}
      <button onClick={downloadPDF}>Download PDF</button>
      <button onClick={printBill}>Print</button>
    </div>
  );
};

export default Billing;
