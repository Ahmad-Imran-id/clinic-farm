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
  // Convert sales data to CSV format
  const csvData = convertToCSV(salesData);
  // Create a Blob and trigger the download
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales_data.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Convert JSON to CSV format
const convertToCSV = (data) => {
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => row[header]).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

// Function to handle exporting sales data to PDF (optional)
export const exportToPDF = (salesData) => {
  const doc = new jsPDF();
  doc.text('Sales Data', 10, 10);
  
  // Example: Add sales data in a basic format to PDF
  salesData.forEach((item, index) => {
    doc.text(`${item.name} - $${item.price}`, 10, 20 + (index * 10));
  });

  doc.save('sales_data.pdf');
};
