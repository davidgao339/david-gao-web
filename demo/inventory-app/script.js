document.addEventListener('DOMContentLoaded', () => {
    
    // Mock Data for Coffee Shop Inventory
    let inventory = [
        { id: 1, name: "Espresso Roast Beans", category: "Coffee", stock: 12, unit: "kg", threshold: 15, costPerUnit: 18.50 },
        { id: 2, name: "Whole Milk", category: "Dairy", stock: 45, unit: "gallons", threshold: 20, costPerUnit: 4.20 },
        { id: 3, name: "Oat Milk", category: "Dairy Alt", stock: 18, unit: "cartons", threshold: 24, costPerUnit: 3.50 },
        { id: 4, name: "Vanilla Syrup", category: "Syrup", stock: 8, unit: "bottles", threshold: 10, costPerUnit: 8.00 },
        { id: 5, name: "Caramel Sauce", category: "Syrup", stock: 5, unit: "bottles", threshold: 6, costPerUnit: 9.50 },
        { id: 6, name: "12oz Paper Cups", category: "Packaging", stock: 850, unit: "cups", threshold: 500, costPerUnit: 0.15 },
        { id: 7, name: "16oz Paper Cups", category: "Packaging", stock: 420, unit: "cups", threshold: 500, costPerUnit: 0.18 },
        { id: 8, name: "Lids", category: "Packaging", stock: 1200, unit: "pcs", threshold: 1000, costPerUnit: 0.05 },
        { id: 9, name: "Matcha Powder", category: "Tea", stock: 3, unit: "kg", threshold: 5, costPerUnit: 35.00 }
    ];

    let totalWasteValue = 340.50; // Mock starting waste YTD
    
    // Audit Logs
    let purchaseOrders = [
        { date: "Oct 12", po: "PO-1042", supplier: "Global Beans", item: "Espresso Roast Beans", qty: 10, status: "Delivered" }
    ];
    let wasteLogs = [
        { date: "Oct 10", item: "Oat Milk", category: "Dairy Alt", qty: 2, reason: "Expired / Spoiled", loss: 7.00 }
    ];

    // DOM Elements
    const inventoryBodyDash = document.getElementById('inventory-body-dash');
    const inventoryBodyFull = document.getElementById('inventory-body-full');
    const poBody = document.getElementById('po-body');
    const wasteBody = document.getElementById('waste-body');
    const kpiTotalValue = document.getElementById('kpi-total-value');
    const kpiLowStock = document.getElementById('kpi-low-stock');
    const kpiWasteValue = document.getElementById('kpi-waste-value');
    
    // Modals
    const receiveModal = document.getElementById('receive-modal');
    const wasteModal = document.getElementById('waste-modal');
    const createPoModal = document.getElementById('create-po-modal');
    
    // Render Functions
    function renderInventory() {
        if(inventoryBodyDash) inventoryBodyDash.innerHTML = '';
        if(inventoryBodyFull) inventoryBodyFull.innerHTML = '';
        
        let totalValue = 0;
        let lowStockCount = 0;
        
        // Filter logic
        let filteredInventory = [...inventory];
        if (typeof filterActive !== 'undefined' && filterActive) {
            filteredInventory = filteredInventory.filter(item => item.stock < item.threshold);
        }

        // Sort: lowest stock relative to threshold first
        const sorted = filteredInventory.sort((a, b) => {
            const aRatio = a.stock / a.threshold;
            const bRatio = b.stock / b.threshold;
            return aRatio - bRatio;
        });

        sorted.forEach((item, index) => {
            totalValue += item.stock * item.costPerUnit;
            
            let status = 'Good';
            let statusClass = 'status-good';
            let rowClass = '';
            
            if (item.stock === 0) {
                status = 'Out of Stock';
                statusClass = 'status-out';
                rowClass = 'row-low-stock';
                lowStockCount++;
            } else if (item.stock < item.threshold) {
                status = 'Low Stock';
                statusClass = 'status-low';
                rowClass = 'row-low-stock';
                lowStockCount++;
            }
            
            // Dashboard Row (Simple)
            const trDash = document.createElement('tr');
            trDash.className = `${rowClass} stagger-in`;
            trDash.style.animationDelay = `${index * 0.05}s`;
            trDash.innerHTML = `
                <td class="item-name">${item.name}</td>
                <td>${item.category}</td>
                <td class="stock-value">${item.stock}</td>
                <td>${item.unit}</td>
                <td>${item.threshold}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            `;
            if(inventoryBodyDash) inventoryBodyDash.appendChild(trDash);
            
            // Full View Row (Includes Cost)
            const trFull = document.createElement('tr');
            trFull.className = `${rowClass} stagger-in`;
            trFull.style.animationDelay = `${index * 0.05}s`;
            trFull.innerHTML = `
                <td class="item-name">${item.name}</td>
                <td>${item.category}</td>
                <td class="stock-value">${item.stock}</td>
                <td>${item.unit}</td>
                <td>${item.threshold}</td>
                <td>$${item.costPerUnit.toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            `;
            if(inventoryBodyFull) inventoryBodyFull.appendChild(trFull);
        });
        
        // Update KPIs
        animateValue(kpiTotalValue, totalValue, true);
        kpiLowStock.innerText = lowStockCount;
        
        if(lowStockCount > 0) {
            kpiLowStock.classList.add('alert-text');
            kpiLowStock.parentElement.classList.add('alert-card');
        } else {
            kpiLowStock.classList.remove('alert-text');
            kpiLowStock.parentElement.classList.remove('alert-card');
        }
    }
    
    function renderLogs() {
        if(poBody) {
            poBody.innerHTML = '';
            purchaseOrders.forEach((po, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'stagger-in';
                tr.style.animationDelay = `${idx * 0.05}s`;
                tr.innerHTML = `
                    <td>${po.date}</td>
                    <td class="item-name">${po.po}</td>
                    <td>${po.supplier}</td>
                    <td>${po.item}</td>
                    <td class="stock-value">+${po.qty}</td>
                    <td><span class="status-badge status-good">${po.status}</span></td>
                `;
                poBody.appendChild(tr);
            });
        }
        
        if(wasteBody) {
            wasteBody.innerHTML = '';
            wasteLogs.forEach((log, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'stagger-in row-low-stock';
                tr.style.animationDelay = `${idx * 0.05}s`;
                tr.innerHTML = `
                    <td>${log.date}</td>
                    <td class="item-name">${log.item}</td>
                    <td>${log.category}</td>
                    <td class="stock-value" style="color:var(--danger-color)">-${log.qty}</td>
                    <td>${log.reason}</td>
                    <td style="color:var(--danger-color); font-weight:600;">$${log.loss.toFixed(2)}</td>
                `;
                wasteBody.appendChild(tr);
            });
        }
    }
    
    function updateWasteKPI() {
        animateValue(kpiWasteValue, totalWasteValue, true);
    }

    function populateModalSelects() {
        const receiveSelect = document.getElementById('receive-item');
        const wasteSelect = document.getElementById('waste-item');
        
        receiveSelect.innerHTML = '';
        wasteSelect.innerHTML = '';
        
        inventory.forEach(item => {
            const opt = `<option value="${item.id}">${item.name} (${item.stock} ${item.unit} in stock)</option>`;
            receiveSelect.innerHTML += opt;
            wasteSelect.innerHTML += opt;
        });
    }

    // Number Animation Helper
    function animateValue(obj, end, isCurrency = false) {
        // Simple instant update for now, can be expanded to ticking animation
        obj.innerText = isCurrency ? `$${end.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : end;
        
        // Add a small bounce effect
        obj.style.transform = 'scale(1.1)';
        obj.style.color = 'var(--primary-color)';
        setTimeout(() => {
            obj.style.transform = 'scale(1)';
            obj.style.color = '';
        }, 200);
    }

    // Toast Helper
    function showToast(message, isWaste = false) {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${isWaste ? 'waste' : ''}`;
        const icon = isWaste ? 'delete_sweep' : 'check_circle';
        const color = isWaste ? 'var(--danger-color)' : 'var(--primary-color)';
        
        toast.innerHTML = `<span class="material-icons" style="color: ${color}">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Event Listeners for Modals
    document.getElementById('btn-receive').addEventListener('click', () => {
        populateModalSelects();
        document.getElementById('receive-qty').value = 1;
        receiveModal.style.display = 'flex';
    });
    
    document.getElementById('btn-waste').addEventListener('click', () => {
        populateModalSelects();
        document.getElementById('waste-qty').value = 1;
        wasteModal.style.display = 'flex';
    });
    
    // Close Modals
    const closeModals = () => {
        receiveModal.style.display = 'none';
        wasteModal.style.display = 'none';
        createPoModal.style.display = 'none';
    };
    document.getElementById('receive-close').addEventListener('click', closeModals);
    document.getElementById('receive-cancel').addEventListener('click', closeModals);
    document.getElementById('waste-close').addEventListener('click', closeModals);
    document.getElementById('waste-cancel').addEventListener('click', closeModals);
    document.getElementById('create-po-close').addEventListener('click', closeModals);
    document.getElementById('create-po-cancel').addEventListener('click', closeModals);

    // Save Actions
    document.getElementById('receive-save').addEventListener('click', () => {
        const itemId = parseInt(document.getElementById('receive-item').value);
        const qty = parseInt(document.getElementById('receive-qty').value);
        
        const item = inventory.find(i => i.id === itemId);
        if(item) {
            item.stock += qty;
            
            // Log PO
            purchaseOrders.unshift({
                date: "Today",
                po: "PO-" + Math.floor(1000 + Math.random() * 9000),
                supplier: "Local Supplier",
                item: item.name,
                qty: qty,
                status: "Delivered"
            });
            
            showToast(`Received ${qty} ${item.unit} of ${item.name}`);
            renderInventory();
            renderLogs();
            closeModals();
        }
    });

    document.getElementById('waste-save').addEventListener('click', () => {
        const itemId = parseInt(document.getElementById('waste-item').value);
        const qty = parseInt(document.getElementById('waste-qty').value);
        const reason = document.getElementById('waste-reason').value;
        
        const item = inventory.find(i => i.id === itemId);
        if(item) {
            const actualWaste = Math.min(qty, item.stock);
            item.stock -= actualWaste;
            
            const loss = actualWaste * item.costPerUnit;
            totalWasteValue += loss;
            
            // Log Waste
            wasteLogs.unshift({
                date: "Today",
                item: item.name,
                category: item.category,
                qty: actualWaste,
                reason: reason,
                loss: loss
            });
            
            showToast(`Recorded waste: ${actualWaste} ${item.unit} of ${item.name}`, true);
            renderInventory();
            renderLogs();
            updateWasteKPI();
            closeModals();
        }
    });

    // Tab Navigation Logic
    const navItems = {
        'nav-dashboard': 'view-dashboard',
        'nav-stock': 'view-stock',
        'nav-po': 'view-po',
        'nav-waste': 'view-waste',
        'nav-settings': 'view-settings'
    };
    
    Object.keys(navItems).forEach(navId => {
        const navEl = document.getElementById(navId);
        if (navEl) {
            navEl.addEventListener('click', () => {
                // Remove active class from all nav items
                document.querySelectorAll('.sidebar .nav-item').forEach(el => el.classList.remove('active'));
                navEl.classList.add('active');
                
                // Hide all views
                document.querySelectorAll('.view-section').forEach(view => view.style.display = 'none');
                
                // Show target view
                const targetViewId = navItems[navId];
                const targetView = document.getElementById(targetViewId);
                if (targetView) targetView.style.display = 'block';
                
                // If closing sidebar on mobile
                if (window.innerWidth <= 768 && sidebar) {
                    sidebar.classList.remove('open');
                }
            });
        }
    });

    // Mobile Menu
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if(menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Unmapped Buttons Logic
    let filterActive = false;
    const btnFilter = document.getElementById('btn-filter');
    if (btnFilter) {
        btnFilter.addEventListener('click', () => {
            filterActive = !filterActive;
            btnFilter.classList.toggle('btn-primary', filterActive);
            btnFilter.classList.toggle('btn-outline', !filterActive);
            btnFilter.innerHTML = `<span class="material-icons btn-icon">${filterActive ? 'filter_list_off' : 'filter_list'}</span>${filterActive ? 'Clear Filter' : 'Filter Low Stock'}`;
            showToast(filterActive ? "Showing only low stock items" : "Showing all items");
            renderInventory();
        });
    }

    const btnCreatePo = document.getElementById('btn-create-po');
    if (btnCreatePo) {
        btnCreatePo.addEventListener('click', () => {
            const listEl = document.getElementById('create-po-list');
            listEl.innerHTML = '';
            let lowItemsFound = false;
            
            inventory.forEach(item => {
                if (item.stock < item.threshold) {
                    lowItemsFound = true;
                    const orderQty = item.threshold * 2;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="item-name">${item.name}</td>
                        <td style="color:var(--danger-color); font-weight:600;">${item.stock} ${item.unit}</td>
                        <td class="stock-value">+${orderQty}</td>
                    `;
                    listEl.appendChild(tr);
                }
            });
            
            if (lowItemsFound) {
                createPoModal.style.display = 'flex';
            } else {
                showToast("All stock levels are good, no POs needed");
            }
        });
    }

    const createPoSave = document.getElementById('create-po-save');
    if (createPoSave) {
        createPoSave.addEventListener('click', () => {
            let poCreated = 0;
            inventory.forEach(item => {
                if (item.stock < item.threshold) {
                    const orderQty = item.threshold * 2;
                    purchaseOrders.unshift({
                        date: "Today",
                        po: "DRAFT-" + Math.floor(1000 + Math.random() * 9000),
                        supplier: "Auto-Generated",
                        item: item.name,
                        qty: orderQty,
                        status: "Pending"
                    });
                    poCreated++;
                }
            });
            
            showToast(`Generated ${poCreated} draft POs for low stock items`);
            renderLogs();
            closeModals();
        });
    }

    const toggleReorder = document.getElementById('toggle-reorder');
    if (toggleReorder) {
        toggleReorder.addEventListener('change', (e) => {
            showToast(`Auto-reorder alerts ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    const toggleDark = document.getElementById('toggle-dark');
    if (toggleDark) {
        toggleDark.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-theme', e.target.checked);
            showToast(`Theme changed to ${e.target.checked ? 'Dark' : 'Light'} Mode`);
        });
    }

    // Init
    renderInventory();
    renderLogs();
    updateWasteKPI();
});
