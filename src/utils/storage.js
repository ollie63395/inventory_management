const KEYS = {
  PRODUCTS: 'im_products',
  CUSTOMERS: 'im_customers',
  TRANSACTIONS: 'im_transactions',
  UNITS: 'im_units'
};

const getJSON = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setJSON = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
  // Products
  getProducts: () => getJSON(KEYS.PRODUCTS, []),
  saveProduct: (product) => {
    const products = getJSON(KEYS.PRODUCTS, []);
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    setJSON(KEYS.PRODUCTS, products);
  },
  deleteProduct: (id) => {
    const products = getJSON(KEYS.PRODUCTS, []);
    const newProducts = products.filter(p => p.id !== id);
    setJSON(KEYS.PRODUCTS, newProducts);
  },

  // Customers
  getCustomers: () => getJSON(KEYS.CUSTOMERS, []),
  saveCustomer: (customer) => {
    const customers = getJSON(KEYS.CUSTOMERS, []);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    setJSON(KEYS.CUSTOMERS, customers);
  },

  // Transactions
  getTransactions: () => getJSON(KEYS.TRANSACTIONS, []),
  logTransaction: (transaction) => {
    // transaction structure: { id, date, type: 'sale' | 'import', customerName (optional), items: [] }
    const transactions = getJSON(KEYS.TRANSACTIONS, []);
    transactions.unshift(transaction); // Newest first
    setJSON(KEYS.TRANSACTIONS, transactions);
  },
  // Deprecated alias for backward compatibility or refactor usage
  addTransaction: (transaction) => {
    storage.logTransaction({ ...transaction, type: 'sale' });
  },

  // Units
  getUnits: () => getJSON(KEYS.UNITS, ['Cái', 'Gói', 'Hộp', 'Bộ', 'Kg', 'Mét']),
  saveUnit: (unit) => {
    if (!unit) return;
    const units = getJSON(KEYS.UNITS, ['Cái', 'Gói', 'Hộp', 'Bộ', 'Kg', 'Mét']);
    if (!units.includes(unit)) {
      units.push(unit);
      setJSON(KEYS.UNITS, units);
    }
  },
  removeUnit: (unit) => {
    const units = getJSON(KEYS.UNITS, ['Cái', 'Gói', 'Hộp', 'Bộ', 'Kg', 'Mét']);
    const newUnits = units.filter(u => u !== unit);
    setJSON(KEYS.UNITS, newUnits);
  }
};

// Seed Data for Demo
export const seedData = () => {
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    const products = [
      { id: '1', name: 'Nút áo trắng (Size nhỏ)', unit: 'Gói', quantity: 100, initialQuantity: 100, image: '' },
      { id: '2', name: 'Nút áo trắng (Size vừa)', unit: 'Gói', quantity: 50, initialQuantity: 50, image: '' },
      { id: '3', name: 'Đinh tiểu ly 5mm', unit: 'Hộp', quantity: 20, initialQuantity: 20, image: '' },
    ];
    setJSON(KEYS.PRODUCTS, products);
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    const customers = [
      { id: '1', name: 'Khách lẻ' },
      { id: '2', name: 'Cô Ba (Chợ Lớn)' },
    ];
    setJSON(KEYS.CUSTOMERS, customers);
  }
};
