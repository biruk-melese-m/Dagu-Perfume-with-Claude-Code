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
      showToast('New Order Received!');
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
          <button class="qa-btn" onclick="viewOrder('${o.id}')" title="Full Intelligence">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          ${o.status === 'Pending' ? `<button class="qa-btn qa-approve" onclick="quickUpdate('${o.id}', 'Confirmed')" title="Instant Confirm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>` : ''}
          <button class="qa-btn qa-cancel" onclick="quickUpdate('${o.id}', 'Cancelled')" title="Abort Mission">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
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
window.onload = async () => {
  loadOrders();
  loadSavedNotes();
  await initProducts();
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
async function initProducts() {
  if (typeof db !== 'undefined' && db) {
    try {
      const snap = await db.collection("products").get();
      snap.forEach(doc => {
        const data = doc.data();
        const existingIdx = ALL.findIndex(p => p.no === data.no);
        if (data.deleted) {
          if (existingIdx >= 0) ALL.splice(existingIdx, 1);
        } else if (existingIdx >= 0) {
          ALL[existingIdx] = { ...ALL[existingIdx], ...data };
        } else {
          ALL.push(data);
        }
      });
    } catch (e) { console.warn("Could not load dynamic products", e); }
  }
}

function renderProducts() {
  const grid = document.getElementById('prodGrid');
  if (!grid) return;
  
  const q = document.getElementById('prodSearch')?.value.toLowerCase() || '';
  
  const items = (typeof ALL !== 'undefined' ? ALL : []).filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.brand.toLowerCase().includes(q) || 
    String(p.no).includes(q)
  );

  // Group by section
  const sectionsMap = {
    'sec-kings': 'Men (Kings)',
    'sec-queens': 'Women (Queens)',
    'sec-unisex': 'Unisex',
    'sec-oud': 'Oud / Arabian',
    'sec-fresh': 'Fresh',
    'sec-woody': 'Woody',
    'sec-sweet': 'Sweet',
    'sec-designer': 'Designer',
    'sec-sets': 'Sets'
  };

  const grouped = {};
  items.forEach(p => {
    const sec = p.sec || 'misc';
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(p);
  });

  let html = '';
  for (const [secId, pList] of Object.entries(grouped)) {
    const title = sectionsMap[secId] || 'Other Collections';
    html += `<div class="sec-group-title" style="grid-column: 1 / -1; font-size: 18px; color: var(--gold, #c8a050); margin-top: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">${title} (${pList.length})</div>`;
    
    html += pList.map(p => `
      <div class="prod-item">
        <div class="p-ico" style="${p.image ? `background:url('${p.image}') center/cover; border-radius:4px;` : ''}">${p.image ? '' : getEmoji(p.tags || [], p.g)}</div>
        <div class="p-info">
          <div class="p-name">${p.name} <span style="font-size: 10px; color: rgba(255,255,255,0.3)">#${p.no}</span></div>
          <div class="p-brand">${p.brand}</div>
          <div class="p-price">${p.price} Br ${p.price === 'N/A' ? '(Request)' : ''}</div>
        </div>
        <div class="p-actions">
          <button class="qa-btn" onclick="openProductModal(${p.no})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
          </button>
          <button class="qa-btn qa-cancel" onclick="removeProduct(${p.no})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6L17.4 20.4c-.2 1.5-1.4 2.6-2.9 2.6H9.5c-1.5 0-2.8-1.1-2.9-2.6L5 6m3 0V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  grid.innerHTML = html || '<div style="padding:40px; text-align:center; color:rgba(255,255,255,0.2); grid-column: 1 / -1;">No products found.</div>';
}

function handleProdSearch() {
  renderProducts();
}

function openProductModal(no) {
  const isNew = typeof no === 'undefined' || no === null;
  const p = isNew ? null : ALL.find(x => x.no === no);
  
  if (!isNew && !p) return;

  document.getElementById('prodModalTitle').textContent = isNew ? 'Add New Product' : 'Edit Product';
  document.getElementById('prodNo').value = isNew ? '' : p.no;
  document.getElementById('prodBrand').value = isNew ? '' : p.brand;
  document.getElementById('prodName').value = isNew ? '' : p.name;
  document.getElementById('prodPrice').value = isNew ? '' : p.price;
  document.getElementById('prodSec').value = isNew ? 'sec-unisex' : p.sec;
  document.getElementById('prodSize').value = isNew ? '100ml' : p.size;
  document.getElementById('prodGender').value = isNew ? 'u' : p.g;
  document.getElementById('prodOrig').value = isNew ? 'false' : (p.orig ? 'true' : 'false');
  document.getElementById('prodImg').value = isNew ? '' : (p.image || '');
  document.getElementById('prodTags').value = isNew ? 'misc' : (p.tags || []).join(', ');
  document.getElementById('prodVibe').value = isNew ? '' : (p.vibe || '');

  document.getElementById('prodModalBackdrop').classList.add('open');
  document.getElementById('prodModal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('prodModalBackdrop').classList.remove('open');
  document.getElementById('prodModal').classList.remove('open');
}

async function saveProduct() {
  if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
    alert("Firebase database not initialized! Cannot save.");
    return;
  }
  
  const btn = document.querySelector('#prodModal .btn-primary');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    let noStr = document.getElementById('prodNo').value;
    let no;

    if (!noStr) {
      // Find a new ID. Max existing ID + 1.
      const currentMax = ALL.reduce((max, item) => Math.max(max, item.no), 0);
      no = currentMax + 1;
    } else {
      no = parseInt(noStr, 10);
    }

    const data = {
      no: no,
      brand: document.getElementById('prodBrand').value.trim(),
      name: document.getElementById('prodName').value.trim(),
      price: document.getElementById('prodPrice').value.trim(),
      sec: document.getElementById('prodSec').value,
      size: document.getElementById('prodSize').value.trim(),
      g: document.getElementById('prodGender').value,
      orig: document.getElementById('prodOrig').value === 'true',
      image: document.getElementById('prodImg').value.trim(),
      tags: document.getElementById('prodTags').value.split(',').map(s => s.trim()).filter(s => s),
      vibe: document.getElementById('prodVibe').value.trim()
    };

    // Save to Firestore
    await db.collection("products").doc(String(no)).set(data);
    
    // Update local memory
    const existingIdx = ALL.findIndex(p => p.no === no);
    if (existingIdx >= 0) {
      ALL[existingIdx] = { ...ALL[existingIdx], ...data };
    } else {
      ALL.push(data);
    }
    
    renderProducts();
    closeProductModal();
    showToast(`Product ${no} saved successfully`);
    
  } catch(e) {
    console.error("Error saving product:", e);
    alert("Failed to save product: " + e.message);
  } finally {
    btn.textContent = 'Save Product Details';
    btn.disabled = false;
  }
}

async function removeProduct(no) {
  if (!confirm(`Are you sure you want to permanently delete Product #${no}?`)) return;
  if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
    alert("Firebase database not initialized! Cannot delete.");
    return;
  }

  try {
    // Mark as deleted in Firestore
    await db.collection("products").doc(String(no)).set({ no: no, deleted: true });
    
    // Remove from local array
    const existingIdx = ALL.findIndex(p => p.no === no);
    if (existingIdx >= 0) {
      ALL.splice(existingIdx, 1);
    }
    
    renderProducts();
    showToast(`Product ${no} deleted successfully`);
  } catch(e) {
    console.error("Error deleting product:", e);
    alert("Failed to delete product: " + e.message);
  }
}

// HELPER from script.js logic simplified
function getEmoji(tags, gender) {
  // Return generic SVG instead of emoji
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><path d="M7 7.5c0-2 1.5-4 4.5-4s4.5 2 4.5 4v2c2 1 3 3 3 5v3c0 1.5-1 3-3 3H8c-2 0-3-1.5-3-3v-3c0-2 1-4 3-5v-2z"></path><line x1="12" y1="3.5" x2="12" y2="1.5"></line><line x1="10" y1="1.5" x2="14" y2="1.5"></line></svg>`;
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
