import React from 'react';
import * as XLSX from 'xlsx';

const BillingExport = ({ cartItems }) => {
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(cartItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Billing');
    XLSX.writeFile(workbook, 'billing_data.xlsx');
  };

  return (
    <button onClick={handleExport} className="btn">Export to Excel</button>
  );
};

export default BillingExport;
