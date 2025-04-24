import React from 'react';
import { Button } from 'react-bootstrap';
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
      const worksheet = XLSX.utils.json_to_sheet(
        cartItems.map(item => ({
          'Product Name': item.name,
          'Pack Size': `${item.packSize} ${item.unit}`,
          'Quantity Sold': item.quantity,
          'Unit Price': item.price,
          'Total Price': (item.price * item.quantity).toFixed(2),
          'Partial Sale': item.isPartial ? 'Yes' : 'No'
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Billing');
      XLSX.writeFile(workbook, `billing_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  return (
    <Button 
      variant="primary" 
      onClick={handleExport}
      disabled={cartItems.length === 0}
    >
      Export to Excel
    </Button>
  );
};

BillingExport.propTypes = {
  cartItems: PropTypes.array.isRequired
};

export default BillingExport;
