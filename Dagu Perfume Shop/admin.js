// ════════════════════════════════════════════
//  ADMIN LOGIC
// ════════════════════════════════════════════

// We rely on the `db` variable initialized in firebase-config.js.

let allOrders = [];
let filteredOrders = [];
let unsubscribe = null;
let currentOrderDetails = null;
let lastCount = -1;
let activeTab = 'orders';

function formatPrice(n) {
  return Number(n).toLocaleString('en-ET') + ' Br';
}

function formatDate(fbTimestamp) {
  if (!fbTimestamp) return 'Just now';
  const d = fbTimestamp.toDate ? fbTimestamp.toDate() : new Date(fbTimestamp);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getStatusBadge(status) {
  const s = (status || 'Pending').toLowerCase();
  return `<span class="badge ${s}">${s}</span>`;
}

// ── LOADING DATA ───────────────────────────────────────────────
function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading orders...</td></tr>';
  
  if (!db || typeof db.collection !== 'function') {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #e68e9e;">Firebase is not configured correctly. Check firebase-config.js.</td></tr>';
    return;
  }

  // Real-time listener
  if (unsubscribe) unsubscribe();
  
  unsubscribe = db.collection("orders").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    allOrders = [];
    let pendingCount = 0;
    let completedCount = 0;
    let revenue = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      if(!data.status) data.status = 'Pending';
      const refId = 'DGU-' + data.id.slice(-6).toUpperCase();
      data.refId = refId;
      allOrders.push(data);
      
      if (data.status.toLowerCase() === 'pending') pendingCount++;
      if (data.status.toLowerCase() === 'completed') completedCount++;
      if (data.status.toLowerCase() === 'completed' || data.status.toLowerCase() === 'confirmed') revenue += Number(data.totalAmount || 0);
    });

    if (lastCount !== -1 && allOrders.length > lastCount) {
      playSuccessSound();
      showToast('🚀 New Order Received!');
    }
    lastCount = allOrders.length;
    
    filteredOrders = [...allOrders];
    updateStatsDisplay(pendingCount, completedCount, revenue);
    renderTable();
  }, error => {
    console.error("Error fetching orders:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #e68e9e;">Error fetching orders: ${error.message}</td></tr>`;
  });
}

function renderTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No results match your criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map((o, idx) => `
    <tr class="order-row reveal" style="--i: ${idx}">
      <td class="order-ref-col">
        <div class="o-ref">${o.refId}</div>
        <div class="o-id-sub">${o.id.slice(0,8)}...</div>
      </td>
      <td class="order-date-col">${formatDate(o.timestamp)}</td>
      <td class="order-user-col">
        <div class="o-cust">${o.customerName || 'Anonymous'}</div>
        <div class="o-phone">${o.customerPhone || 'Silent'}</div>
      </td>
      <td class="order-amount-col">
        <div class="o-amt">${formatPrice(o.totalAmount || 0)}</div>
        <div class="o-method">${o.paymentMethod || '???'}</div>
      </td>
      <td class="order-status-col">${getStatusBadge(o.status)}</td>
      <td class="order-actions-col">
        <div class="quick-actions">
          <button class="qa-btn" onclick="viewOrder('${o.id}')" title="Full Intelligence">👁️</button>
          ${o.status === 'Pending' ? `<button class="qa-btn qa-approve" onclick="quickUpdate('${o.id}', 'Confirmed')" title="Instant Confirm">✅</button>` : ''}
          <button class="qa-btn qa-cancel" onclick="quickUpdate('${o.id}', 'Cancelled')" title="Abort Mission">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function quickUpdate(id, status) {
  try {
    await db.collection("orders").doc(id).update({ status });
    showToast('Order status updated in real-time');
  } catch (e) {
    alert("Field update failed: " + e.message);
  }
}

// ── MODAL ACTIONS ──────────────────────────────────────────────
function viewOrder(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  currentOrderDetails = order;

  document.getElementById('modalTitle').textContent = `Order ${order.refId}`;
  document.getElementById('modalCustomerName').textContent = order.customerName || '--';
  document.getElementById('modalCustomerPhone').textContent = order.customerPhone || '--';
  document.getElementById('modalTxId').textContent = order.transactionId || '--';
  document.getElementById('modalPayMethod').textContent = order.paymentMethod || '--';
  document.getElementById('modalDate').textContent = formatDate(order.timestamp);
  
  const select = document.getElementById('modalStatusSelect');
  select.value = order.status;
  
  // Render Items
  const itemsList = document.getElementById('modalItemsList');
  if (order.items && order.items.length > 0) {
    itemsList.innerHTML = order.items.map(i => `
      <div class="order-item-row">
        <div class="order-item-main">
          <div class="o-name">${i.brand} ${i.name}</div>
          <div class="o-meta">Size: ${i.size || 'N/A'} | Qty: ${i.qty}</div>
        </div>
        <div class="o-price">${formatPrice((i.price || 0) * (i.qty || 1))}</div>
      </div>
    `).join('');
  } else {
    itemsList.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 13px;">No items recorded.</div>';
  }

  document.getElementById('modalTotal').textContent = `Total: ${formatPrice(order.totalAmount || 0)}`;

  document.getElementById('orderModalBackdrop').classList.add('open');
  document.getElementById('orderModal').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('orderModalBackdrop').classList.remove('open');
  document.getElementById('orderModal').classList.remove('open');
  currentOrderDetails = null;
}

function updateStatsDisplay(pending, completed, revenue) {
  document.getElementById('statTotal').textContent = allOrders.length;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statRevenue').textContent = formatPrice(revenue);
}

function handleSearch() {
  const q = document.getElementById('orderSearch').value.toLowerCase().trim();
  if (!q) {
    filteredOrders = [...allOrders];
  } else {
    filteredOrders = allOrders.filter(o => 
      o.refId.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').toLowerCase().includes(q) ||
      (o.transactionId || '').toLowerCase().includes(q)
    );
  }
  renderTable();
}

function playSuccessSound() {
  const audio = document.getElementById('notifSound');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio wait for user', e));
  }
}

function showToast(msg) {
  console.log(msg);
}

async function updateOrderStatus() {
  if (!currentOrderDetails) return;
  const newStatus = document.getElementById('modalStatusSelect').value;
  const orderId = currentOrderDetails.id;
  
  try {
    await db.collection("orders").doc(orderId).update({
      status: newStatus
    });
    // The snapshot listener will automatically catch the update and re-render the table
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status. Please try again.");
  }
}

// Auto-load on page start
window.onload = () => {
  loadOrders();
  loadSavedNotes();
  renderProducts();
};

// ── TAB SWITCHING ────────────────────────────────────────────────
function switchTab(tabId) {
  activeTab = tabId;
  const sections = document.querySelectorAll('.tab-content');
  const navItems = document.querySelectorAll('.nav-item');
  
  sections.forEach(s => s.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  
  document.getElementById(tabId + 'Section').classList.add('active');
  const navId = 'nav' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
  document.getElementById(navId).classList.add('active');
}

// ── PRODUCT CATALOGUE ──────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('prodGrid');
  if (!grid) return;
  
  const q = document.getElementById('prodSearch')?.value.toLowerCase() || '';
  
  // Assuming ALL is available globally or we fetch it
  // Since we are in separate file, we can either duplicate ALL or fetch it.
  // For this exercise, I'll refer to the data directly since I as agent see it.
  // But in real code, you'd export it or fetch it.
  const items = (typeof ALL !== 'undefined' ? ALL : []).filter(p => 
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  );

  grid.innerHTML = items.map(p => `
    <div class="prod-item">
      <div class="p-ico">${getEmoji(p.tags, p.g)}</div>
      <div class="p-info">
        <div class="p-name">${p.name}</div>
        <div class="p-brand">${p.brand}</div>
        <div class="p-price">${p.price} Br</div>
      </div>
      <div class="p-actions">
        <button class="qa-btn" onclick="alert('Price updating coming soon (Firebase integration needed)')">✏️</button>
      </div>
    </div>
  `).join('');
}

function handleProdSearch() {
  renderProducts();
}

// HELPER from script.js logic simplified
function getEmoji(tags,gender){
  if(tags.includes('oud'))return'🕌';
  if(tags.includes('floral')&&gender==='w')return'🌸';
  if(tags.includes('fresh'))return'🌊';
  if(tags.includes('sweet'))return'🍯';
  return'🏺';
}

// ── GOD MODE TOOLS ──────────────────────────────────────────────
function runCalc() {
  const cost = parseFloat(document.getElementById('calcCost').value) || 0;
  const sale = parseFloat(document.getElementById('calcSale').value) || 0;
  
  const profit = sale - cost;
  const margin = sale !== 0 ? (profit / sale) * 100 : 0;
  
  document.getElementById('resProfit').textContent = formatPrice(profit);
  document.getElementById('resMargin').textContent = margin.toFixed(1) + '%';
  
  if (margin < 15) document.getElementById('resMargin').style.color = '#e68e9e';
  else if (margin > 35) document.getElementById('resMargin').style.color = '#8fd19e';
  else document.getElementById('resMargin').style.color = '#c8a050';
}

function saveNotes() {
  const val = document.getElementById('adminNotes').value;
  localStorage.setItem('dagu_admin_notes', val);
}

function loadSavedNotes() {
  const val = localStorage.getItem('dagu_admin_notes');
  if (val) document.getElementById('adminNotes').value = val;
}

async function copyBroadcast() {
  const val = document.getElementById('broadcastTpl').value;
  if (!val) return;
  await navigator.clipboard.writeText(`Dagu Perfume Update: ${val}`);
  alert('Broadcast template copied to clipboard!');
}
