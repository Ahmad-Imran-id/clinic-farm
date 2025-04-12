import React, { useState, useEffect } from 'react';
import BillingForm from './BillingForm';
import BillingCart from './BillingCart';
import BillingExport from './BillingExport';
import BillingSummary from './BillingSummary';
import { fetchSalesData } from './billingUtils';  // Assume this utility fetches sales data

const BillingMain = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch sales data when the component mounts
    fetchSalesData()
      .then((data) => {
        setSalesData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sales data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="billing-main-container">
      <h2>Billing System</h2>
      <div className="billing-form">
        {/* Billing Form to add items */}
        <BillingForm />
      </div>
      <div className="billing-cart">
        {/* Display the cart */}
        {loading ? <p>Loading cart...</p> : <BillingCart salesData={salesData} />}
      </div>
      <div className="billing-summary">
        {/* Display billing summary */}
        <BillingSummary salesData={salesData} />
      </div>
      <div className="billing-export">
        {/* Exporting Sales Data */}
        <BillingExport salesData={salesData} />
      </div>
    </div>
  );
};

export default BillingMain;
