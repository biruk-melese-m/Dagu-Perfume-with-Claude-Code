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
let currentFilters = { category: [], type: [], scent: [], price: [] };

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
      if (!data.status) data.status = 'Pending';
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
        <div class="o-id-sub">${o.id.slice(0, 8)}...</div>
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
          <button class="qa-btn" onclick="deleteOrder('${o.id}')" title="Delete Order" style="color:#e68e9e; border-color:rgba(230,142,158,0.2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

async function deleteOrder(id) {
  if (!confirm('Are you absolutely sure you want to permanently delete this order? This cannot be undone.')) return;
  if (!db || typeof db.collection !== 'function') return;

  try {
    await db.collection("orders").doc(id).delete();
    showToast('Order permanently deleted');
  } catch (error) {
    console.error("Error deleting order:", error);
    alert("Failed to delete order: " + error.message);
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
    itemsList.innerHTML = order.items.map(i => {
      // Find image from ALL if possible
      const p = ALL.find(x => x.no === i.no);
      const imgSrc = p ? p.image : '';

      return `
      <div class="order-item-row">
        <div class="o-thumb">
          ${imgSrc ? `<img src="${imgSrc}" onerror="handleImgErr(this)">` : '<div class="o-no-img">?</div>'}
        </div>
        <div class="order-item-main">
          <div class="o-name">${i.brand} ${i.name}</div>
          <div class="o-meta">Size: ${i.size || 'N/A'} | Qty: ${i.qty}</div>
        </div>
        <div class="o-price">${formatPrice((i.price || 0) * (i.qty || 1))}</div>
      </div>`;
    }).join('');
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
  initReveal();
};

function handleImgErr(img) {
  if (img.dataset.triedFallback) {
    img.style.opacity = '0.1'; // Dim instead of hiding in admin
    return;
  }
  img.dataset.triedFallback = "true";
  const current = img.src;
  if (current.includes('Perfume%20Photos%201')) {
    img.src = current.replace('Perfume%20Photos%201', 'Perfume%20Photos');
  } else if (current.includes('Perfume%20Photos')) {
    img.src = current.replace('Perfume%20Photos', 'Perfume%20Photos%201');
  }
}

// ── REVEAL LOGIC ────────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  // Removed .reveal from prod-item to ensure visibility in admin
  document.querySelectorAll('.order-row.reveal').forEach(el => observer.observe(el));
}

function toggleCategory(cat, el) {
  if (currentFilters.category.includes(cat)) {
    currentFilters.category = []; // Single select clear
    el.classList.remove('active');
  } else {
    currentFilters.category = [cat]; // Single select set
    document.querySelectorAll('[onclick^="toggleCategory"]').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
  }
  updateResetBtn();
  renderProducts();
}

function toggleScent(scnt, el) {
  if (currentFilters.scent.includes(scnt)) {
    currentFilters.scent = []; // Single select clear
    el.classList.remove('active');
  } else {
    currentFilters.scent = [scnt]; // Single select set
    document.querySelectorAll('[onclick^="toggleScent"]').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
  }
  updateResetBtn();
  renderProducts();
}

function resetCategories() {
  currentFilters = { category: [], type: [], scent: [], price: [] };
  document.querySelectorAll('.sel-btn').forEach(btn => btn.classList.remove('active'));
  updateResetBtn();
  renderProducts();
  initReveal();
}

function updateResetBtn() {
  const isAnyActive = currentFilters.category.length > 0 || currentFilters.scent.length > 0;
  document.getElementById('secResetBtn').classList.toggle('show', isAnyActive);
}

// ── TAB SWITCHING ────────────────────────────────────────────────
function switchTab(tabId) {
  activeTab = tabId;
  const sections = document.querySelectorAll('.tab-content');
  const navItems = document.querySelectorAll('.nav-item');

  sections.forEach(s => s.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  document.getElementById(tabId + 'Section').classList.add('active');
  const navId = 'nav' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
  if (document.getElementById(navId)) document.getElementById(navId).classList.add('active');
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
  const { category, scent } = currentFilters;
  const isSelectorActive = category.length > 0 || scent.length > 0;

  // Helper function to match product against current filters
  const matchFilter = (p) => {
    if (!p) return false;
    const name = (p.name || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const no = String(p.no || '');
    
    const matchesSearch = name.includes(q) || brand.includes(q) || no.includes(q);

    if (!matchesSearch) return false;

    if (isSelectorActive) {
      const gCode = p.g || 'u';
      const pSecs = p.sections || [p.sec || 'misc'];

      let genderMatch = category.length === 0;
      if (category.includes('men') && gCode === 'm') genderMatch = true;
      if (category.includes('women') && gCode === 'w') genderMatch = true;
      if (category.includes('unisex') && gCode === 'u') genderMatch = true;

      let scentMatch = scent.length === 0;
      if (scent.includes('oud') && pSecs.includes('sec-oud')) scentMatch = true;
      if (scent.includes('fresh') && pSecs.includes('sec-fresh')) scentMatch = true;
      if (scent.includes('latest') && POPULAR_IDS['sec-latest'].includes(p.no)) scentMatch = true;
      if (scent.includes('favorites') && POPULAR_IDS['sec-favorites'].includes(p.no)) scentMatch = true;

      return genderMatch && scentMatch;
    }

    return true;
  };

  const SECTIONS_CONFIG = [
    { id: 'sec-unisex', title: 'Unified Collection (Unisex)' },
    { id: 'sec-kings', title: 'For Men (Kings)' },
    { id: 'sec-queens', title: 'For Women (Queens)' },
    { id: 'sec-latest', title: 'Latest & Trending Scents' },
    { id: 'sec-favorites', title: "Most People's Favorites" },
    { id: 'sec-oud', title: 'Oud & Arabian Treasures' },
    { id: 'sec-fresh', title: 'Fresh & Aquatic Collection' },
    { id: 'sec-sweet', title: 'Sweet & Gourmand' },
    { id: 'sec-woody', title: 'Woody & Intense' },
    { id: 'sec-designer', title: 'Designer Masterpieces' },
    { id: 'sec-sets', title: 'Curated Sets & Splashes' },
    { id: 'sec-other', title: 'Other Essentials' },
    { id: 'sec-misc', title: 'Miscellaneous' }
  ];

  let html = '';

  SECTIONS_CONFIG.forEach(sec => {
    let items = [];
    if (sec.id === 'sec-latest') {
      const latestIds = (typeof POPULAR_IDS !== 'undefined' && POPULAR_IDS['sec-latest']) || [];
      items = ALL.filter(p => latestIds.includes(p.no) && matchFilter(p));
    } else if (sec.id === 'sec-favorites') {
      const favIds = (typeof POPULAR_IDS !== 'undefined' && POPULAR_IDS['sec-favorites']) || [];
      items = ALL.filter(p => favIds.includes(p.no) && matchFilter(p));
    } else {
      items = ALL.filter(p => (p.sections || [p.sec || 'misc']).includes(sec.id) && matchFilter(p));
    }

    if (items.length === 0) return;

    html += `
      <div class="sec-group-title" style="grid-column: 1 / -1; margin-top: 30px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: var(--gold); border-bottom: 1px solid rgba(200,160,80,0.2); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>${sec.title}</span>
        <span style="font-size: 11px; opacity: 0.5;">${items.length} Products</span>
      </div>`;

    html += (items || []).map((p, idx) => `
      <div class="prod-item" style="--i: ${idx}">
        <div class="p-ico">
          ${p.image ? `<img src="${p.image}" onerror="handleImgErr(this)" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">` : getEmoji(p.tags || [], p.g)}
        </div>
        <div class="p-info">
          <div class="p-name">${p.name || 'Unknown'} <span class="p-id-pill">#${p.no || '??'}</span></div>
          <div class="p-brand">${p.brand || 'Exclusive'}</div>
          <div class="p-price">${p.price === 'N/A' ? 'Request' : (p.price || '0') + ' Br'}</div>
          <div class="p-secs-row">
            ${(p.sections || [p.sec || 'misc']).map(s => `<span class="p-sec-tag">${String(s).replace('sec-', '')}</span>`).join('')}
          </div>
        </div>
        <div class="p-actions">
          <button class="qa-btn" onclick="openProductModal(${p.no})" title="Edit Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
          </button>
          <button class="qa-btn" onclick="removeProduct(${p.no})" title="Delete Product" style="color:#e68e9e; border-color:rgba(230,142,158,0.2);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `).join('');
  });

  grid.innerHTML = html || '<div style="padding:80px; text-align:center; color:rgba(255,255,255,0.2); grid-column: 1 / -1;">No products found matching the Store catalogue.</div>';
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

  // Set primary section
  document.getElementById('prodSec').value = isNew ? 'sec-unisex' : (p.sections ? p.sections[0] : p.sec);

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
      sections: [document.getElementById('prodSec').value], // Simplified for admin edit
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

  } catch (e) {
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
  } catch (e) {
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
