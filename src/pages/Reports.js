// reports.js
import { db } from "../firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

// Utility function to get start and end of month
export const getMonthDateRange = (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    startTimestamp: Timestamp.fromDate(start),
    endTimestamp: Timestamp.fromDate(end),
  };
};

// Generate monthly sales report for given year and month (0-indexed month)
export const generateMonthlyReport = async (year, month) => {
  const { startTimestamp, endTimestamp } = getMonthDateRange(year, month);

  const salesRef = collection(db, "sales");
  const q = query(
    salesRef,
    where("timestamp", ">=", startTimestamp),
    where("timestamp", "<=", endTimestamp)
  );

  const querySnapshot = await getDocs(q);
  const monthlySales = [];
  let totalRevenue = 0;
  let categoryTotals = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    monthlySales.push(data);
    totalRevenue += data.total || 0;
    (data.items || []).forEach((item) => {
      const category = item.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + item.total;
    });
  });

  const reportData = {
    year,
    month,
    totalRevenue,
    totalSales: monthlySales.length,
    categoryTotals,
    createdAt: Timestamp.now(),
  };

  await addDoc(collection(db, "monthlyReports"), reportData);
  return reportData;
};

// Optionally, fetch saved reports
export const getMonthlyReports = async () => {
  const reportsRef = collection(db, "monthlyReports");
  const snapshot = await getDocs(reportsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
