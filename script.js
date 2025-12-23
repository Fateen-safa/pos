
// Sample product data
let products = [
];

let cart = [];
let currentLanguage = 'en';
let transactions = [];
let transactionCounter = 1;

// if editing modifies the transaction, call:
saveTransactions();
renderTransactions();


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

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const inventoryList = document.getElementById('inventoryList');
const receiptContent = document.getElementById('receiptContent');

// Delete Transaction API Call
async function deleteTransactionFromServer(transactionId) {
    const res = await fetch(`http://127.0.0.1:5000/transactions/${transactionId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete transaction");
    }

    return data; // { message: "Transaction deleted successfully" }
}



// function loadTransactions() {
//     fetch('/transactions')
//         .then(response => response.json())
//         .then(data => {
//             transactions = data;
//             renderTransactions();
//         })
//         .catch(error => {
//             console.error('Error loading transactions:', error);
//         });
// }


// Update stock for a single product
async function updateProductStock(productId, quantity) {
    try {
        const res = await fetch("http://127.0.0.1:5000/update_stock", {
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





async function deleteProductFromServer(productId) {
    const res = await fetch(`http://127.0.0.1:5000/delete_product/${productId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
    }

    return data; // { message: "Product deleted", id: productId }
}



async function fetchProducts() {
    const res = await fetch("http://127.0.0.1:5000/get_stock");
    products = await res.json();
    renderProducts();
    renderInventory();
}

async function addProductToServer(product) {
    const res = await fetch("http://127.0.0.1:5000/add_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });
    return res.json();
}

async function saveTransactionToServer(transaction) {
    const res = await fetch("http://127.0.0.1:5000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
    });
    return res.json();
}

async function loadTransactions() {
    const res = await fetch("http://127.0.0.1:5000/transactions");
    transactions = await res.json();
    renderTransactions();
}



// Initialize the application
async function init() {
    await fetchProducts();
    await loadTransactions();
    //alert(products)
    //alert(transactions)
    setupEventListeners();
    setLanguage('en');
    const td = new Date().toISOString().substr(0, 10);
    document.getElementById('transactionDate').value = td;
}

// Render products to the products grid
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

// Render inventory list
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


// Add product to cart
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

// Render cart items
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

// Increase item quantity in cart
function increaseQuantity(productId) {
    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem && cartItem.quantity < cartItem.product.stock) {
        cartItem.quantity++;
        renderCart();
        updateReceipt();
    }
}


// function editTransaction(id) {
//     const t = transactions.find(tx => tx.id === id);
//     if (!t) return;

//     // Reload form data
//     document.getElementById('customerName').value = t.customerName;
//     document.getElementById('transactionDate').value = t.date;
//     document.getElementById('transactionStatus').value = t.status;

//     // Reload products into cart
//     cart = t.products.map(p => ({
//         product: { ...p.product },
//         quantity: p.quantity
//     }));

//     renderCart();
//     updateReceipt(t);
// }



// Decrease item quantity in cart
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

// function renderTransactions() {
//     const transactionList = document.getElementById('transactionHistory');
//     if (!transactionList) return;
    
//     transactionList.innerHTML = '';
    
//     transactions.slice(0, 50).forEach(transaction => {
//         const div = document.createElement('div');
//         div.className = 'transaction-item';
//         div.innerHTML = `
//             <div class="transaction-header">
//                 <span class="receipt-number">${transaction.receiptNumber}</span>
//                 <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
//                 <span class="transaction-total">$${transaction.total.toFixed(2)}</span>
//             </div>
//             <div class="transaction-customer">Customer: ${transaction.customerName}</div>
//             <div class="transaction-items">Items: ${transaction.products.length}</div>
//         `;
//         transactionList.appendChild(div);
//     });
// }


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

    // // Attach edit/delete events
    // document.querySelectorAll('.edit-transaction').forEach(btn => {
    //     btn.addEventListener('click', (e) => {
    //         const id = parseInt(e.target.dataset.id);
    //         editTransaction(id);
    //     });
    // });

    document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteTransaction(id);
        });
    });
}


// Delete transaction function using the API call
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

// // Edit product
// function editProduct(productId) {
//     const product = products.find(p => p.id === productId);
//     if (product) {
//         const newName = prompt('Enter new product name:', product.name);
//         if (newName === null) return;

//         const newPrice = parseFloat(prompt('Enter new price:', product.price));
//         if (isNaN(newPrice)) return;

//         const newStock = parseInt(prompt('Enter new stock quantity:', product.stock));
//         if (isNaN(newStock)) return;

//         product.name = newName;
//         product.price = newPrice;
//         product.stock = newStock;

//         renderProducts();
//         renderInventory();
//         renderCart();
//         updateReceipt();
//     }
// }
// Delete product and update UI
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
        console.error("❌ Error deleting product:", err.message);
        alert("Error deleting product: " + err.message);
    }
}


// Set language
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

// Setup event listeners
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

    // Complete transaction button
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
        // Modified transaction completion handler
        saveTransactionToServer(transaction).then(savedTx => {
            // Add to local transactions array (optional - you can rely on server data)
            transactions.unshift(savedTx); // Add to beginning to maintain order

            // Keep only last 50 transactions locally
            if (transactions.length > 50) {
                transactions = transactions.slice(0, 50);
            }

            renderTransactions();
            cart = [];
            renderCart();
            fetchProducts(); // reload stock
            updateReceipt(savedTx);
            alert("Transaction completed successfully!");
        }).catch(error => {
            console.error('Error saving transaction:', error);
            alert("Error saving transaction: " + error.message);
        });


        // Reduce stock
        cart.forEach(item => {
            const product = products.find(p => p.id === item.product.id);

        });

        for (const item of cart) {

            await updateProductStock(item.product.id, item.quantity);
        }

        // we need to change the stock in the database 


    });


    /*     // Export receipt button (now exports to PNG)
        document.getElementById('exportReceiptBtn').addEventListener('click', () => {
            const receipt = document.getElementById('receiptContent');
            if (!receipt.innerHTML.trim()) {
                alert('No receipt to export.');
                return;
            }
    
            html2canvas(receipt).then(canvas => {
                const link = document.createElement('a');
                link.download = 'receipt.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }); */

    // Clear cart button

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

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

const savedTransactions = localStorage.getItem('transactions');

if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);  // ✅ Correct
    if (transactions.length > 0) {
        transactionCounter = Math.max(...transactions.map(t => t.id)) + 1;
    }
    renderTransactions();
}





// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
