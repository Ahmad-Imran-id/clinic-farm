// src/pages/Reports.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [dailySales, setDailySales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchSalesForDate(selectedDate);
  }, [selectedDate]);

  const fetchSalesForDate = async (dateStr) => {
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const salesQuery = query(
      collection(db, 'sales'),
      where('date', ">=", start.toISOString()),
      where('date', "<=", end.toISOString())
    );

    const snapshot = await getDocs(salesQuery);
    const salesData = snapshot.docs.map(doc => doc.data());
    setDailySales(salesData);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dailySales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Sales');
    XLSX.writeFile(workbook, `Sales_Report_${selectedDate}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Sales Report - ${selectedDate}`, 10, 10);
    autoTable(doc, {
      startY: 20,
      head: [['Invoice', 'Total', 'Tabs', 'Syrups', 'Injections']],
      body: dailySales.map(sale => [
        sale.invoiceNumber,
        `$${sale.totalAmount}`,
        `$${sale.totalTabs}`,
        `$${sale.totalSyrups}`,
        `$${sale.totalInjections}`
      ])
    });
    doc.save(`Sales_Report_${selectedDate}.pdf`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Reports</h2>
      <label>
        Select Date: 
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
      </label>

      <table border="1" cellPadding="5" style={{ marginTop: '20px', width: '100%' }}>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Total</th>
            <th>Tabs</th>
            <th>Syrups</th>
            <th>Injections</th>
          </tr>
        </thead>
        <tbody>
          {dailySales.map((sale, index) => (
            <tr key={index}>
              <td>{sale.invoiceNumber}</td>
              <td>${sale.totalAmount}</td>
              <td>${sale.totalTabs}</td>
              <td>${sale.totalSyrups}</td>
              <td>${sale.totalInjections}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button onClick={exportToExcel}>Download Excel</button>
        <button onClick={exportToPDF}>Download PDF</button>
      </div>
    </div>
  );
};

export default Reports;
