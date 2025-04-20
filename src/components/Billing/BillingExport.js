import React from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import { saveBillingData } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../utils/authUtils';

const BillingExport = ({ cartItems }) => {
  const handleExport = async () => {
    if (cartItems.length === 0) {
      alert('No items to export!');
      return;
    }

    try {
      const userId = getCurrentUserUid();
      if (!userId) throw new Error('User not authenticated');
      
      // Save to database first
      await saveBillingData(cartItems, userId);
      
      // Then export to Excel
      const worksheet = XLSX.utils.json_to_sheet(cartItems.map(item => ({
        Name: item.name,
        Category: item.category,
        Quantity: item.quantity,
        'Unit Price': item.price,
        'Total Price': (item.price * item.quantity).toFixed(2)
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Billing');
      XLSX.writeFile(workbook, `billing_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  return (
    <button 
      onClick={handleExport} 
      className="btn"
      disabled={cartItems.length === 0}
    >
      Export to Excel
    </button>
  );
};

BillingExport.propTypes = {
  cartItems: PropTypes.array.isRequired
};

export default BillingExport;
