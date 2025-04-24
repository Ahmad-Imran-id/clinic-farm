import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import InventoryForm from './InventoryForm';
import BulkAddForm from './BulkAddForm';
import InventoryTable from './InventoryTable';
import SearchBar from './SearchBar';
import * as XLSX from 'xlsx';
import { 
  fetchInventoryData, 
  addOrUpdateItem as addInventoryItem,
  updateDoc as updateInventoryItem,
  deleteInventoryItem,
  bulkAddItems as bulkAddInventoryItems
} from './inventoryUtils';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: '',
    unitsPerPack: '',
    unitType: '',
    category: 'Tablet',
  });
  
  const [bulkProducts, setBulkProducts] = useState([
    { name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' }
  ]);
  
  const handleBulkSubmit = async () => {
    if (!user || !user.uid) {
      setError("You must be logged in to add products");
      return;
    }
    
    // Filter out products without a name
    const validProducts = bulkProducts.filter(product => product.name.trim() !== '');
    
    if (validProducts.length === 0) {
      setError("No valid products to add");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await bulkAddInventoryItems(user.uid, validProducts);
      setBulkProducts([{ name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' }]);
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Bulk add failed:", err);
      setError(`Failed to add products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!user || !user.uid) return;
    
    setLoading(true);
    try {
      const productList = await fetchInventoryData(user.uid);
      setProducts(productList);
      setError(null);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(`Failed to load inventory: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.uid) {
      fetchProducts();
    }
  }, [user]);

  const exportToExcel = () => {
    if (products.length === 0) {
      setError("No products to export");
      return;
    }
    
    try {
      const worksheet = XLSX.utils.json_to_sheet(products);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
      XLSX.writeFile(workbook, 'Inventory.xlsx');
    } catch (err) {
      console.error("Export failed:", err);
      setError(`Failed to export data: ${err.message}`);
    }
  };

  const handleAddOrUpdateProduct = async () => {
    if (!user || !user.uid) {
      setError("You must be logged in to add products");
      return;
    }

    if (!newProduct.name) {
      setError("Product name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        await updateInventoryItem(user.uid, editingItem.id, newProduct);
      } else {
        await addInventoryItem(user.uid, newProduct);
      }

      await fetchProducts(); // Refresh the list
      
      // Reset form
      setNewProduct({
        name: '',
        price: '',
        quantity: '',
        unitsPerPack: '',
        unitType: '',
        category: 'Tablet',
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving product:", err);
      setError(`Failed to save product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!user || !user.uid) {
      setError("You must be logged in to delete products");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteInventoryItem(user.uid, productId);
      await fetchProducts(); // Refresh the list
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(`Failed to delete product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category if needed
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventory Management</h2>
      
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        products={products}
      />

      <InventoryForm
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        handleAddOrUpdateProduct={handleAddOrUpdateProduct}
        editingItem={editingItem}
        loading={loading}
      />

      <BulkAddForm
        bulkProducts={bulkProducts}
        setBulkProducts={setBulkProducts}
        handleBulkSubmit={handleBulkSubmit}
        loading={loading}
      />

      <button 
        onClick={exportToExcel}
        disabled={products.length === 0 || loading}
      >
        Download Inventory Excel
      </button>

      <InventoryTable
        filteredProducts={filteredProducts}
        handleEdit={(product) => { setEditingItem(product); setNewProduct(product); }}
        handleDelete={handleDeleteProduct}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        loading={loading}
      />
    </div>
  );
};

export default Inventory;
