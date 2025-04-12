import React from 'react';
import BillingForm from './BillingForm';
import BillingCart from './BillingCart';
import BillingSummary from './BillingSummary';
import BillingExport from './BillingExport';

const BillingPage = () => {
  return (
    <div className="billing-container">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      <BillingForm />
      <BillingCart />
      <BillingSummary />
      <BillingExport />
    </div>
  );
};

export default BillingPage;
