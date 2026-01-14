// --------------------------------------------------------------------------------
// frontend/script.js
// Purpose: Simple POS frontend script — fetches products/transactions from backend,
// manages a shopping cart, builds receipts, and lets the user export data.
// Notes: This file is written in vanilla JS and relies on specific DOM element IDs
// present in the HTML. Comments below explain important sections and possible
// pitfalls (ordering, localStorage, id/receipt generation).
// --------------------------------------------------------------------------------
// API_BASE URL (backend API endpoint used by fetch wrappers)
const API_BASE = 'http://localhost:5000/api';
// Sample product data
// Application state
let products = []; // Array of product objects received from backend

let cart = []; // Current shopping cart: [{ product, quantity }, ...]
let currentLanguage = 'en'; // active locale key (en, ar, he)
let transactions = []; // list of past transactions
let transactionCounter = 1; // counter used to generate local ids/receipt numbers

// NOTE: The next two calls saveTransactions() and renderTransactions() were
// originally placed here in the file. Saving immediately at top-level can
// overwrite previously stored transactions in localStorage because it runs
// before we load from storage. We keep them out of the initialization flow —
// transactions are loaded later in `init()` via `loadTransactions()`.


// -------------------------
// Internationalization strings
// -------------------------
// Contains translations for UI labels used via `data-translate` attributes.
// Add additional languages here. Keys must match `data-translate` values.
//
// Example: <button data-translate="addProduct"></button>
// The `setLanguage()` function swaps those texts at runtime.
//
// Language translations
const translations = {
    en: {
        searchProducts: "Search Products",
        availableProducts: "Available Products",
        inventory: "Inventory Management",
        addProduct: "Add New Product",
        productName: "Product Name",
        price: "Price",
        quantity: "Quantity",
        shoppingCart: "Shopping Cart",
        total: "Total:",
        customerName: "Customer Name",
        date: "Date",
        status: "Status",
        pending: "Pending",
        completed: "Completed",
        cancelled: "Cancelled",
        completeTransaction: "Complete Transaction",
        exportReceipt: "Export to PNG",
        clearCart: "Clear Cart",
        receiptPreview: "Receipt Preview",
        remove: "Remove",
        edit: "Edit",
        delete: "Delete"
    },
    ar: {
        searchProducts: "بحث عن المنتجات",
        availableProducts: "المنتجات المتاحة",
        inventory: "إدارة المخزون",
        addProduct: "إضافة منتج جديد",
        productName: "اسم المنتج",
        price: "السعر",
        quantity: "الكمية",
        shoppingCart: "عربة التسوق",
        total: "المجموع:",
        customerName: "اسم العميل",
        date: "التاريخ",
        status: "الحالة",
        pending: "قيد الانتظار",
        completed: "مكتمل",
        cancelled: "ملغى",
        completeTransaction: "إتمام المعاملة",
        exportReceipt: "تصدير إلى Png",
        clearCart: "تفريغ العربة",
        receiptPreview: "معاينة الإيصال",
        remove: "إزالة",
        edit: "تعديل",
        delete: "حذف"
    },
    he: {
        searchProducts: "חפש מוצרים",
        availableProducts: "מוצרים זמינים",
        inventory: "ניהול מלאי",
        addProduct: "הוסף מוצר חדש",
        productName: "שם המוצר",
        price: "מחיר",
        quantity: "כמות",
        shoppingCart: "עגלת קניות",
        total: "סך הכל:",
        customerName: "שם הלקוח",
        date: "תאריך",
        status: "סטטוס",
        pending: "ממתין",
        completed: "הושלם",
        cancelled: "בוטל",
        completeTransaction: "השלם עסקה",
        exportReceipt: "ייצא ל-Word",
        clearCart: "נקה עגלה",
        receiptPreview: "תצוגה מקדימה של הקבלה",
        remove: "הסר",
        edit: "ערוך",
        delete: "מחק"
    }
};

// -------------------------
// DOM references
// -------------------------
// Cache references to frequently used DOM elements. If any of these IDs
// are missing from the HTML, the script will throw — defensive checks can be
// added if you expect the markup to vary.
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const inventoryList = document.getElementById('inventoryList');
const receiptContent = document.getElementById('receiptContent');

// -------------------------
// API: Transactions
// -------------------------
// Functions that talk to the backend for transaction-related operations.
// They return parsed JSON and throw on non-ok responses so callers can
// surface errors to the user.
async function deleteTransactionFromServer(transactionId) {
    const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete transaction");
    }

    return data; // { message: "Transaction deleted successfully" }
}





// -------------------------
// API: Stock / Products
// -------------------------
// `updateProductStock` sends a small payload to update stock on the server.
// Note: In this codebase the backend is expected to handle stock adjustments
// when a transaction is saved, so this helper is available for manual updates.
async function updateProductStock(productId, quantity) {
    try {
        const res = await fetch(`${API_BASE}/stock/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to update stock");
        }

        console.log("✅ Stock updated:", data);
        // Refresh product list after update
        await fetchProducts();

        return data;
    } catch (err) {
        console.error("❌ Error updating stock:", err.message);
        alert("Error updating stock: " + err.message);
    }
}





// Delete a product record on the server
async function deleteProductFromServer(productId) {
    const res = await fetch(`${API_BASE}/stock/${productId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
    }

    return data; // { message: "Product deleted", id: productId }
}



// Fetch latest products list and re-render UI
async function fetchProducts() {
    const res = await fetch(`${API_BASE}/stock`);
    products = await res.json();
    renderProducts();
    renderInventory();
}

// Add a product on the server
async function addProductToServer(product) {
    const res = await fetch(`${API_BASE}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });
    return res.json();
}

// Save a transaction on the server
// The backend should handle stock adjustments and assign canonical ids.
async function saveTransactionToServer(transaction) {
    const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
    });
    return res.json();
}

// Load transaction history from server
async function loadTransactions() {
    const res = await fetch(`${API_BASE}/transactions`);
    transactions = await res.json();
    renderTransactions();
}



// -------------------------
// Initialization
// -------------------------
// `init()` bootstraps the app: fetch products and transactions, attach
// event listeners, set default language and today's date.
async function init() {
    await fetchProducts();
    await loadTransactions();
    setupEventListeners();
    setLanguage('en');
    const td = new Date().toISOString().substr(0, 10);
    document.getElementById('transactionDate').value = td;
}

// -------------------------
// Rendering: Products & Inventory
// -------------------------
// `renderProducts()` renders clickable product cards that add to the cart
function renderProducts() {
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price.toFixed(2)} <span class="currency">S</span></div>
                    <div>Stock: ${product.stock}</div>
                `;
        productCard.addEventListener('click', () => addToCart(product));
        productsGrid.appendChild(productCard);
    });
}

// `renderInventory()` shows the admin inventory list with delete controls.
function renderInventory() {
    inventoryList.innerHTML = '';
    products.forEach(product => {
        const inventoryItem = document.createElement('div');
        inventoryItem.className = 'inventory-item';
        inventoryItem.innerHTML = `
                    <div>
                        <div>${product.name}</div>
                        <div>${product.price.toFixed(2)} <span class="currency">S</span> | Stock: ${product.stock}</div>
                    </div>
                    <div class="inventory-actions">
                        <i class="fas fa-trash delete-btn" data-id="${product.id}"></i>
                    </div>
                `;
        inventoryList.appendChild(inventoryItem);
    });
    // removed fteaure to edit products for simplicity
    // // Add event listeners to edit and delete buttons
    // document.querySelectorAll('.edit-btn').forEach(btn => {
    //     btn.addEventListener('click', (e) => {
    //         const productId = parseInt(e.target.dataset.id);
    //         editProduct(productId);
    //     });
    // });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            deleteProduct(productId);

        });
    });
}


// -------------------------
// Cart management
// -------------------------
// `addToCart()` and the quantity helpers manage the `cart` array and keep
// quantities bounded by the product stock. UI updates are handled by
// `renderCart()` and `updateReceipt()`.
function addToCart(product) {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert(`Only ${product.stock} items available in stock.`);
        }
    } else {
        if (product.stock > 0) {
            cart.push({ product, quantity: 1 });
        } else {
            alert('Product out of stock.');
        }
    }

    renderCart();
    updateReceipt();
}

// Render the cart contents and wire the +/- buttons
function renderCart() {
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
                    <div class="item-details">
                        <div class="item-name">${item.product.name}</div>
                        <div class="item-price">${item.product.price.toFixed(2)} <span class="currency">S</span></div>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.product.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.product.id}">+</button>
                    </div>
                `;
        cartItems.appendChild(cartItem);
    });

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    cartTotal.textContent = `${total.toFixed(2)} S`;

    // Add event listeners to quantity buttons
    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            increaseQuantity(productId);
        });
    });

    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            decreaseQuantity(productId);
        });
    });
}

// Increase item quantity in cart (respecting stock limits)
function increaseQuantity(productId) {
    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem && cartItem.quantity < cartItem.product.stock) {
        cartItem.quantity++;
        renderCart();
        updateReceipt();
    }
}





// Decrease item quantity in cart (removes item at 0)
function decreaseQuantity(productId) {
    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem) {
        cartItem.quantity--;
        if (cartItem.quantity === 0) {
            cart = cart.filter(item => item.product.id !== productId);
        }
        renderCart();
        updateReceipt();
    }
}




// -------------------------
// Transactions UI
// -------------------------
// Render the transaction history panel and bind delete handlers.
function renderTransactions() {
    const history = document.getElementById('transactionHistory');
    history.innerHTML = '';
    transactions.slice(0, 50).forEach(t => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <div>
              <strong>${t.receiptNumber}</strong> - ${t.customerName} (${t.date}) - ${t.total.toFixed(2)} S - <em>${t.status}</em>
            </div>
            <div>
              <button class="btn btn-danger delete-transaction" data-id="${t.id}">Delete</button>
            </div>
        `;
        history.appendChild(div);
    });


    document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteTransaction(id);
        });
    });
}


// Delete a transaction via the backend then remove from local state
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        await deleteTransactionFromServer(id);
        
        // Remove from local array and re-render
        transactions = transactions.filter(t => t.id !== id);
        renderTransactions();
        
        alert('Transaction deleted successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting transaction: ' + error.message);
    }
}



// -------------------------
// Receipt rendering
// -------------------------
// Builds the HTML for the receipt preview from the `cart` and optional
// transaction argument (used when showing a saved transaction's receipt).
function updateReceipt(transaction = null) {
    const customerName = document.getElementById('customerName').value || 'Customer';
    const date = document.getElementById('transactionDate').value;
    const status = document.getElementById('transactionStatus').value;

    const receiptNumber = transaction ? transaction.receiptNumber : `T-${String(transactionCounter).padStart(5, '0')}`;

    let receiptHTML = `
        <div class="receipt-header">
            <h2>Aiham caraj</h2>
            <p>Barta'a</p>
            <p>052-634-3989</p>
            <p>Receipt #: ${receiptNumber}</p>
            <p>Date: ${date}</p>
            <p>Customer: ${customerName}</p>
            <p>Status: ${status}</p>
        </div>
        <div class="receipt-items">
            <div class="receipt-item"><span>Product</span><span>Amount</span></div>
    `;

    cart.forEach(item => {
        receiptHTML += `
            <div class="receipt-item">
                <span>${item.product.name} x ${item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)} S</span>
            </div>`;
    });

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    receiptHTML += `
        </div>
        <div class="receipt-total">
            <span>Total:</span>
            <span>${total.toFixed(2)} S</span>
        </div>`;

    receiptContent.innerHTML = receiptHTML;
}


// Delete a product from server + update local UI state
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const result = await deleteProductFromServer(productId); // call API
        console.log("✅ Deleted:", result);

        // Remove locally
        products = products.filter(p => p.id !== productId);
        cart = cart.filter(item => item.product.id !== productId);

        // Re-render
        renderProducts();
        renderInventory();
        renderCart();
        updateReceipt();

        alert("Product deleted successfully!");
    } catch (err) {
        console.error(" Error deleting product:", err.message);
        alert("Error deleting product: " + err.message);
    }
}


// -------------------------
// Internationalization helper
// -------------------------
function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    document.getElementById('searchInput').placeholder = translations[lang].searchProducts + '...';
    document.getElementById('customerName').placeholder = translations[lang].customerName;

    // Update button texts
    document.getElementById('addProductBtn').textContent = translations[lang].addProduct;
}

// -------------------------
// Event wiring
// -------------------------
// All DOM event listeners (buttons, search input, language switching)
// are installed here. Keep this function readable so it's easy to add tests
// or feature-flag specific handlers.
function setupEventListeners() {
    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.dataset.lang;
            setLanguage(lang);
        });
    });

    // Add product button
    document.getElementById('addProductBtn').addEventListener('click', () => {
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const newProduct = { name, price, stock: quantity };

        if (name && !isNaN(price) && !isNaN(quantity)) {
            const newProduct = {
                id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
                name,
                price,
                stock: quantity
            };

            addProductToServer(newProduct).then(savedProduct => {
                products.push(savedProduct);
                renderProducts();
                renderInventory();
            });



            // Clear form
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productQuantity').value = '';
        } else {
            alert('Please fill all fields with valid values.');
        }
    });

    // Complete transaction button - FIXED
document.getElementById('completeTransactionBtn').addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Cart is empty. Add products to complete transaction.');
        return;
    }

    const customerName = document.getElementById('customerName').value || 'Customer';
    const date = document.getElementById('transactionDate').value;
    const status = document.getElementById('transactionStatus').value;

    const transaction = {
        id: transactionCounter++,
        receiptNumber: `T-${String(transactionCounter).padStart(5, '0')}`,
        date,
        customerName,
        products: [...cart],
        total: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status
    };

    try {
        //  Backend handles stock update automatically!
        const savedTx = await saveTransactionToServer(transaction);
        
        // Update local state
        transactions.unshift(savedTx);
        if (transactions.length > 50) {
            transactions = transactions.slice(0, 50);
        }

        renderTransactions();
        cart = [];
        renderCart();
        fetchProducts(); // Just refresh the view
        updateReceipt(savedTx);
        alert("Transaction completed successfully!");
        
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert("Error saving transaction: " + error.message);
    }
    
    // ❌❌❌ REMOVE THIS ENTIRE SECTION! ❌❌❌
    // cart.forEach(item => {
    //     const product = products.find(p => p.id === item.product.id);
    // });
    
    // for (const item of cart) {
    //     await updateProductStock(item.product.id, item.quantity); // ❌ DUPLICATE!
    // }
});


    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is already empty.');
            return;
        }

        if (confirm('Are you sure you want to clear the cart?')) {
            cart = [];
            renderCart();
            updateReceipt();
        }
    });

    // Customer name and date change events
    document.getElementById('customerName').addEventListener('input', updateReceipt);
    document.getElementById('transactionDate').addEventListener('change', updateReceipt);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );

        productsGrid.innerHTML = '';
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${product.price.toFixed(2)} <span class="currency">S</span></div>
                        <div>Stock: ${product.stock}</div>
                    `;
            productCard.addEventListener('click', () => addToCart(product));
            productsGrid.appendChild(productCard);
        });
    });
}

// -------------------------
// Export functionality
// -------------------------
// Export transactions to XLSX and receipt preview to PNG.
document.getElementById('exportTransactionsBtn').addEventListener('click', () => {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
        Receipt: t.receiptNumber,
        Customer: t.customerName,
        Date: t.date,
        Total: t.total,
        Status: t.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
});

document.getElementById('exportPngBtn').addEventListener('click', () => {
    const receipt = document.getElementById('receiptContent');
    if (!receipt.innerHTML.trim()) {
        alert("No receipt to export.");
        return;
    }

    html2canvas(receipt).then(canvas => {
        const link = document.createElement('a');
        link.download = 'receipt.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

// -------------------------
// Persistence (localStorage)
// -------------------------
// `saveTransactions()` writes the `transactions` array to localStorage so
// the browser keeps a copy between reloads. We read from storage on load
// (below) to initialize the local `transactions` array.
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

const savedTransactions = localStorage.getItem('transactions');

if (savedTransactions) {
    // Load persisted transactions if present. We also set `transactionCounter`
    // to one more than the max existing id so locally generated ids don't
    // collide. If your backend assigns canonical ids, you may prefer to
    // rely solely on server-assigned ids rather than pre-assigning locally.
    transactions = JSON.parse(savedTransactions);
    if (transactions.length > 0) {
        transactionCounter = Math.max(...transactions.map(t => t.id)) + 1;
    }
    renderTransactions();
}





// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
