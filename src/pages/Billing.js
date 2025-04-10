import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config'; // Correct import for Firebase
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const productCollection = collection(db, 'inventory');
      const productSnapshot = await getDocs(productCollection);
      const productList = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  const addToCart = (product, quantity) => {
    const newCart = [...cart];
    const existingProduct = newCart.find(item => item.id === product.id);
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      newCart.push({ ...product, quantity });
    }
    setCart(newCart);
    updateTotal(newCart);
  };

  const updateTotal = (newCart) => {
    let newTotal = 0;
    newCart.forEach(item => {
      newTotal += item.price * item.quantity;
    });
    setTotal(newTotal);
  };

  const handleCheckout = async () => {
    // Create a new sale in Firestore
    const saleData = {
      products: cart,
      totalAmount: total,
      date: new Date().toISOString(),
    };
    await addDoc(collection(db, 'sales'), saleData);

    // Update stock quantities
    cart.forEach(async (item) => {
      const productDoc = doc(db, 'inventory', item.id);
      await updateDoc(productDoc, {
        quantity: item.quantity - 1,
      });
    });

    // Clear the cart
    setCart([]);
    setTotal(0);
    alert("Sale recorded successfully!");
  };

  return (
    <div>
      <h2>Billing Page</h2>
      <div>
        <h3>Products</h3>
        <ul>
          {products.map(product => (
            <li key={product.id}>
              {product.name} - ${product.price} 
              <button onClick={() => addToCart(product, 1)}>Add to Cart</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Cart</h3>
        <ul>
          {cart.map(item => (
            <li key={item.id}>
              {item.name} - {item.quantity} x ${item.price} = ${item.quantity * item.price}
            </li>
          ))}
        </ul>
        <h4>Total: ${total}</h4>
        <button onClick={handleCheckout}>Checkout</button>
      </div>
    </div>
  );
};

export default Billing;
