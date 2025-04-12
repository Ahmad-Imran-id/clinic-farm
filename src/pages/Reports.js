import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import * as XLSX from 'xlsx'; // Excel export
import html2canvas from 'html2canvas'; // PDF export
import { jsPDF } from 'jspdf'; // PDF

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  // Fetch sales data based on filters
  const fetchSalesData = async () => {
    const q = query(collection(db, 'sales'), 
      where('date', '>=', `${year}-${month}-01`),
      where('date', '<=', `${year}-${month}-31`)
    );
    const querySnapshot = await getDocs(q);
    const salesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSalesData(salesList);
  };

  useEffect(() => {
    if (month && year) {
      fetchSalesData();
    }
  }, [month, year]);

  const exportToPDF = () => {
    html2canvas(document.querySelector('#reportTable')).then(canvas => {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10);
      pdf.save('monthly-report.pdf');
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(salesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'monthly-report.xlsx');
  };

  return (
    <div className="container mt-5">
      <h2>Monthly Sales Report</h2>

      {/* Filter Section */}
      <div className="mb-4">
        <div className="row">
          <div className="col-md-4">
            <label htmlFor="month" className="form-label">Select Month</label>
            <select
              id="month"
              className="form-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="year" className="form-label">Select Year</label>
            <select
              id="year"
              className="form-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {/* You can generate this dynamically based on current year */}
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered" id="reportTable">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer Name</th>
              <th>Total Amount</th>
              <th>Items Sold</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.invoiceNumber}</td>
                <td>{sale.customerName}</td>
                <td>{sale.totalAmount}</td>
                <td>{sale.itemsSold.length}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Buttons */}
      <div className="mt-4">
        <button className="btn btn-success me-2" onClick={exportToPDF}>Export to PDF</button>
        <button className="btn btn-primary" onClick={exportToExcel}>Export to Excel</button>
      </div>
    </div>
  );
};

export default Reports;
