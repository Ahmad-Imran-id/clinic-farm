import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { CSVLink } from 'react-csv';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button, Form, Row, Col } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = ({ userRole }) => {
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);
  const [filteredReports, setFilteredReports] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      const salesData = salesSnapshot.docs.map(doc => doc.data());

      const monthly = {};

      salesData.forEach(sale => {
        const date = new Date(sale.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const profit = sale.profit || 0;

        if (!monthly[monthKey]) {
          monthly[monthKey] = {
            totalRevenue: 0,
            totalProfit: 0,
            sales: [],
            daily: {}
          };
        }

        monthly[monthKey].totalRevenue += sale.totalAmount;
        monthly[monthKey].totalProfit += profit;
        monthly[monthKey].sales.push(sale);

        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!monthly[monthKey].daily[dayKey]) {
          monthly[monthKey].daily[dayKey] = { total: 0, profit: 0 };
        }
        monthly[monthKey].daily[dayKey].total += sale.totalAmount;
        monthly[monthKey].daily[dayKey].profit += profit;
      });

      const reportsArray = Object.entries(monthly).map(([month, data]) => ({ month, ...data }));
      setMonthlyReports(reportsArray);
    };

    fetchReports();
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Monthly Sales Report', 20, 10);

    const rows = filteredReports.map(r => [r.month, r.totalRevenue.toFixed(2), r.totalProfit.toFixed(2)]);

    autoTable(doc, {
      head: [['Month', 'Total Revenue', 'Total Profit']],
      body: rows,
    });

    doc.save('monthly_report.pdf');
  };

  useEffect(() => {
    const filtered = monthlyReports.filter(r => {
      if (selectedMonth && r.month !== selectedMonth) return false;
      if (customerFilter) {
        return r.sales.some(s => s.customerName?.toLowerCase().includes(customerFilter.toLowerCase()));
      }
      return true;
    });
    setFilteredReports(filtered);
  }, [monthlyReports, selectedMonth, customerFilter]);

  return (
    <div className="container mt-4">
      <h2>Monthly Reports</h2>

      <Form className="mb-4">
        <Row>
          <Col md={3}>
            <Form.Label>Filter by Month:</Form.Label>
            <Form.Control
              type="month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Filter by Customer:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Customer name"
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </Col>
        </Row>
      </Form>

      <div className="mb-3">
        <Button variant="success" className="me-2">
          <CSVLink data={filteredReports.map(r => ({
            Month: r.month,
            Revenue: r.totalRevenue,
            Profit: r.totalProfit,
          }))} filename="monthly_report.csv" className="text-white text-decoration-none">
            Export CSV
          </CSVLink>
        </Button>
        <Button variant="danger" onClick={handleExportPDF}>Export PDF</Button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredReports}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
          <Bar dataKey="totalProfit" fill="#82ca9d" name="Profit" />
        </BarChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredReports}
            dataKey="totalRevenue"
            nameKey="month"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {filteredReports.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <h4 className="mt-4">Summary</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Revenue</th>
            <th>Total Profit</th>
            {userRole === 'admin' && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredReports.map((r, index) => (
            <tr key={index}>
              <td>{r.month}</td>
              <td>₹{r.totalRevenue.toFixed(2)}</td>
              <td>₹{r.totalProfit.toFixed(2)}</td>
              {userRole === 'admin' && (
                <td>
                  <Button size="sm" onClick={() => {
                    setShowDailyBreakdown(true);
                    setSelectedMonth(r.month);
                  }}>
                    View Daily
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {showDailyBreakdown && (
        <>
          <h4 className="mt-5">Daily Breakdown for {selectedMonth}</h4>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.find(r => r.month === selectedMonth)?.daily &&
                Object.entries(filteredReports.find(r => r.month === selectedMonth).daily).map(([date, data], index) => (
                  <tr key={index}>
                    <td>{date}</td>
                    <td>₹{data.total.toFixed(2)}</td>
                    <td>₹{data.profit.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Reports;
