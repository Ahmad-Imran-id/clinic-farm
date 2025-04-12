import React, { useEffect, useState } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { Button, Form, Table, Card } from 'react-bootstrap';

const Reports = ({ currentUser }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [month, setMonth] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [dailySummaries, setDailySummaries] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      if (!currentUser) return; // Ensure user is logged in

      const salesRef = collection(db, 'sales');
      const q = query(salesRef, where('userId', '==', currentUser.uid)); // Filter sales by current user's UID

      const salesSnap = await getDocs(q);
      const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
    };

    fetchSales();
  }, [currentUser]);

  useEffect(() => {
    let filtered = sales;
    if (month) {
      filtered = filtered.filter(sale => sale.date.startsWith(month));
    }
    if (customerFilter) {
      filtered = filtered.filter(sale =>
        sale.customerName?.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }
    setFilteredSales(filtered);

    // Calculate daily summaries
    const summaries = {};
    filtered.forEach(sale => {
      const date = sale.date.split('T')[0];
      if (!summaries[date]) {
        summaries[date] = { total: 0, profit: 0 };
      }
      summaries[date].total += sale.totalAmount;
      summaries[date].profit += sale.profit || 0;
    });
    setDailySummaries(Object.entries(summaries).map(([date, values]) => ({ date, ...values })));
  }, [sales, month, customerFilter]);

  const exportToCSV = () => {
    const rows = filteredSales.map(sale => [
      sale.invoiceNumber,
      sale.customerName,
      sale.totalAmount,
      sale.profit || 0,
      sale.date,
    ]);
    const csvContent = [
      ['Invoice No.', 'Customer', 'Revenue', 'Profit', 'Date'],
      ...rows,
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sales_report.csv');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Invoice No.', 'Customer', 'Revenue', 'Profit', 'Date']],
      body: filteredSales.map(sale => [
        sale.invoiceNumber,
        sale.customerName,
        sale.totalAmount,
        sale.profit || 0,
        sale.date,
      ]),
    });
    doc.save('sales_report.pdf');
  };

  const revenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const profit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  const chartData = {
    labels: filteredSales.map(s => s.date.split('T')[0]),
    datasets: [
      {
        label: 'Revenue',
        data: filteredSales.map(s => s.totalAmount),
        backgroundColor: 'rgba(75,192,192,0.6)',
      },
      {
        label: 'Profit',
        data: filteredSales.map(s => s.profit || 0),
        backgroundColor: 'rgba(255,99,132,0.6)',
      },
    ],
  };

  const pieData = {
    labels: ['Revenue', 'Profit'],
    datasets: [
      {
        data: [revenue, profit],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  return (
    <div className="container mt-4">
      <Card className="p-4">
        <h2>Monthly Reports</h2>

        <Form className="d-flex gap-3 mt-3 mb-3">
          <Form.Control
            type="month"
            onChange={e => setMonth(e.target.value)}
            placeholder="Filter by Month"
          />
          <Form.Control
            type="text"
            placeholder="Customer name"
            onChange={e => setCustomerFilter(e.target.value)}
          />
          <Form.Check
            type="checkbox"
            label="Show individual sales"
            checked={showDetails}
            onChange={e => setShowDetails(e.target.checked)}
          />
        </Form>

        <div className="mb-3">
          <strong>Total Revenue:</strong> ₹{revenue.toFixed(2)} |{' '}
          <strong>Total Profit:</strong> ₹{profit.toFixed(2)}
        </div>

        <div className="d-flex gap-2 mb-4">
          <Button onClick={exportToCSV}>Export CSV</Button>
          <Button onClick={exportToPDF}>Export PDF</Button>
        </div>

        <div className="mb-4">
          <Bar data={chartData} />
        </div>

        <div className="mb-4">
          <Pie data={pieData} />
        </div>

        <h5>Daily Summaries</h5>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Revenue</th>
              <th>Total Profit</th>
            </tr>
          </thead>
          <tbody>
            {dailySummaries.map(summary => (
              <tr key={summary.date}>
                <td>{summary.date}</td>
                <td>₹{summary.total.toFixed(2)}</td>
                <td>₹{summary.profit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {showDetails && (
          <>
            <h5>Individual Sales</h5>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>{sale.invoiceNumber}</td>
                    <td>{sale.customerName}</td>
                    <td>₹{sale.totalAmount}</td>
                    <td>₹{sale.profit || 0}</td>
                    <td>{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
};

export default Reports;
