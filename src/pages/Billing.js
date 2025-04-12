import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';
import { CSVLink } from 'react-csv';
import { Button, Table } from 'react-bootstrap';

const Reports = ({ userRole }) => {
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [individualSales, setIndividualSales] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchMonthlyReports();
  }, []);

  const fetchMonthlyReports = async () => {
    const reportsRef = collection(db, 'monthlyReports');
    const reportsSnap = await getDocs(reportsRef);
    const reportsData = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMonthlySummary(reportsData);
  };

  const fetchSalesDetails = async (month) => {
    const salesRef = collection(db, 'sales');
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const salesQuery = query(salesRef, where('date', ">=", start.toISOString()), where('date', "<", end.toISOString()));
    const salesSnap = await getDocs(salesQuery);
    const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setIndividualSales(salesData);
    setShowDetails(true);
  };

  const exportCSVHeaders = [
    { label: 'Month', key: 'month' },
    { label: 'Total Sales', key: 'totalSales' },
    { label: 'Total Revenue', key: 'totalRevenue' },
    { label: 'Total Profit', key: 'totalProfit' }
  ];

  const COLORS = ['#8884d8', '#82ca9d'];

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Monthly Reports</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlySummary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            data={monthlySummary}
            dataKey="totalRevenue"
            nameKey="month"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {monthlySummary.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4">
        <CSVLink data={monthlySummary} headers={exportCSVHeaders} filename={'monthly_reports.csv'}>
          <Button variant="success">Export as CSV</Button>
        </CSVLink>
      </div>

      {userRole === 'admin' && (
        <div className="mt-5">
          <h4>View Daily Details for a Month</h4>
          <input
            type="month"
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              fetchSalesDetails(e.target.value);
            }}
            className="form-control w-25 mb-3"
          />

          {showDetails && (
            <>
              <h5>Sales for {selectedMonth}</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {individualSales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.invoiceNumber}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                      <td>{sale.customerName || 'N/A'}</td>
                      <td>{sale.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
