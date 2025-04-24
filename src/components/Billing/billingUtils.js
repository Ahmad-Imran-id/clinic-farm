// billingUtils.js
import jsPDF from 'jspdf';

// Function to fetch sales data (replace with actual data-fetching logic)
export const fetchSalesData = async () => {
  try {
    // Example: Fetch sales data from your backend or Firebase
    const response = await fetch('/api/sales'); // Update this with actual API endpoint or Firebase call
    if (!response.ok) {
      throw new Error('Failed to fetch sales data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];  // Return an empty array if there's an error
  }
};

// Function to handle exporting sales data to Excel (example)
export const exportToExcel = (salesData) => {
  if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  try {
    // Convert sales data to CSV format
    const csvData = convertToCSV(salesData);
    // Create a Blob and trigger the download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_data_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export to Excel:', error);
  }
};

// Convert JSON to CSV format with error handling
const convertToCSV = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  try {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        // Handle different data types and escape commas in strings
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  } catch (error) {
    console.error('Error converting to CSV:', error);
    return '';
  }
};

// Function to handle exporting sales data to PDF (optional)
export const exportToPDF = (salesData) => {
  if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
    console.warn('No data to export to PDF');
    return;
  }
  
  try {
    const doc = new jsPDF();
    doc.text('Sales Data', 10, 10);
    
    // Add headers
    const headers = Object.keys(salesData[0]);
    let yPosition = 20;
    
    // Add header row
    doc.setFontStyle('bold');
    doc.text(headers.join(', '), 10, yPosition);
    doc.setFontStyle('normal');
    yPosition += 10;
    
    // Add data rows
    salesData.forEach((item) => {
      const rowData = headers.map(header => String(item[header] || '')).join(', ');
      doc.text(rowData, 10, yPosition);
      yPosition += 7;
      
      // Create a new page if we're running out of space
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });

    doc.save(`sales_data_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('Failed to export to PDF:', error);
  }
};
