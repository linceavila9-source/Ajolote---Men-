/* ============================================================
   AJOLOTE | FONDA MEXICANA — app.js
   ============================================================ */

const WHATSAPP_NUMBER = "50764163179"; // +507 6416-3179
const FEEDBACK_KEY = "ajolote_opiniones";

/* ---------------- FIREBASE (reseñas compartidas con todos) ----------------
   Este proyecto guarda las opiniones en Firestore (Firebase) para que sean
   visibles para cualquier persona que visite la página, no solo en el
   dispositivo donde se escribieron. */ 
   
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBOQsGgUiLoKIGDrEyG1_njf9J1dWvG38o",
  authDomain: "ajolote-fonda.firebaseapp.com",
  projectId: "ajolote-fonda",
  storageBucket: "ajolote-fonda.firebasestorage.app",
  messagingSenderId: "908564943783",
  appId: "1:908564943783:web:5858262621394c04df9c82",
};

let firestoreDB = null;
let firebaseReady = false;
try {
  const configured = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "TU_API_KEY";
  if (configured && window.firebase) {
    firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDB = firebase.firestore();
    firebaseReady = true;
  }
} catch (err) {
  console.warn("No se pudo inicializar Firebase, se usará almacenamiento local:", err);
  firebaseReady = false;
}

/* ---------------- MENU DATA (real menu) ---------------- */
const MENU = {
  tacos: [
    { id: "quesabirria", name: "Quesa Birria", price: 2.5, image: "assets/quesabirria.jpg",
      desc: "Quesadillas con carne de res preparada en su jugo con condimentos importados, servidas con consomé, cebolla y cilantro.",
      badge: "Consomé gratis desde 3 unidades" },
    { id: "birriamen", name: "Birriamen", price: 7.5, image: "assets/birriamen.jpg",
      desc: "Sopa ramen con caldo de birria, carne de birria y queso fundido. La mejor combinación de birria y ramen." },
    { id: "pastor", name: "Tacos al Pastor", price: 2.5, image: "assets/pastor.jpg",
      desc: "Carne de cerdo marinada en chiles secos y especias, asada lentamente en su jugo." },
    { id: "gringa", name: "Gringa", price: 7.5, image: "assets/gringa.jpg",
      desc: "Quesadillas de carne al pastor, servidas con cebolla, cilantro y piña." },
    { id: "quesadilla", name: "Quesadilla", price: 2.0, image: "assets/quesadilla.jpg",
      desc: "Quesadillas naturales con queso mozzarella, ideal para los pequeños de la casa." },
  ],
  promos: [
    { id: "bandeja", name: "Bandeja Ta'con Madre (2 personas)", price: 25, image: "assets/pastor.jpg",
      desc: "10 unidades de tacos o quesadillas, 2 consomés y 2 sodas, para compartir en la mesa.",
      badge: "Solo para comer en el local", restriction: "dineInOnly" },
  ],
  bebidas: [
    { id: "soda-coca", name: "Soda Lata — Coca-Cola", price: 1.5, image: "assets/soda.jpg", desc: "Bien fría." },
    { id: "soda-zero", name: "Soda Lata — Coca-Cola Zero", price: 1.5, image: "assets/soda.jpg", desc: "Bien fría." },
    { id: "soda-sprite", name: "Soda Lata — Sprite", price: 1.5, image: "assets/soda.jpg", desc: "Bien fría." },
    { id: "agua", name: "Botella de Agua", price: 1.0, image: "assets/agua.jpg", desc: "500 ml." },
    { id: "batido-guineo", name: "Batido de Guineo", price: 2.5, image: "assets/guineo.jpg", desc: "Cremoso y natural." },
    { id: "batido-fresa", name: "Batido de Fresa", price: 3.0, image: "assets/fresa.jpg", desc: "Dulce y refrescante." },
    { id: "horchata-jarra", name: "Horchata — Jarra 1 Lt", price: 3.0, image: "assets/horchata.jpg",
      desc: "Para compartir en la mesa.", badge: "No disponible para llevar", restriction: "noTakeout" },
    { id: "horchata-botella", name: "Horchata — Botella 500 ml", price: 2.0, image: "assets/horchata.jpg", desc: "Individual, para llevar." },
    { id: "jamaica-jarra", name: "Jamaica — Jarra 1 Lt", price: 3.0, image: "assets/jamaica.jpg",
      desc: "Para compartir en la mesa.", badge: "No disponible para llevar", restriction: "noTakeout" },
    { id: "jamaica-botella", name: "Jamaica — Botella 500 ml", price: 2.0, image: "assets/jamaica.jpg", desc: "Individual, para llevar." },
  ],
  postres: [
    { id: "flan", name: "Flan de Elote", price: 3.0, image: "assets/flan.jpg", desc: "Suave, cremoso y casero." },
    { id: "churros-especiales", name: "Churros Especiales", price: 3.5, image: "assets/churros.jpg", desc: "Incluyen topping a elegir." },
    { id: "churros-tradicionales", name: "Churros Tradicionales", price: 3.0, image: "assets/churros.jpg", desc: "Clásicos, con azúcar y canela." },
  ],
};

const SERVICE_LABELS = {
  local: "Comer en el Local",
  retiro: "Retirar en el Local",
  domicilio: "Pedido a Domicilio",
};

/* ---------------- STATE ---------------- */
let cart = {};      // { itemId: qty }
let serviceType = null; // 'local' | 'retiro' | 'domicilio'
let yappyAcknowledged = false;
let paymentMethod = null; // 'efectivo' | 'yappy'
let deliveryAddress = "";
let pendingAddId = null; // producto que el cliente quiso agregar antes de elegir servicio


/* ---------------- HELPERS ---------------- */
function findItem(id) {
  for (const cat of Object.values(MENU)) {
    const found = cat.find((i) => i.id === id);
    if (found) return found;
  }
  return null;
}

function money(n) {
  return `$${n.toFixed(2)}`;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------------- RENDER MENU ---------------- */
function renderMenu() {
  renderCategory("menuTacos", MENU.tacos);
  renderCategory("menuPromos", MENU.promos);
  renderCategory("menuBebidas", MENU.bebidas);
  renderCategory("menuPostres", MENU.postres);
}

/* ---------------- CATEGORY FILTER ---------------- */
let activeCategory = "todo"; // 'todo' | 'tacos' | 'promos' | 'bebidas' | 'postres'

function setActiveCategory(cat) {
  activeCategory = cat;

  document.querySelectorAll("#catNav .cat-nav__btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cat === cat);
  });

  document.querySelectorAll(".menu-cat-section").forEach((section) => {
    const show = cat === "todo" || section.dataset.cat === cat;
    section.classList.toggle("is-hidden", !show);
  });

  document.getElementById("menu").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCategory(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(itemCardHTML).join("");
}

function itemCardHTML(item) {
  const qty = cart[item.id] || 0;
  const restricted = isRestricted(item);
  return `
    <li>
      <div class="menu-row" data-item="${item.id}">
        <button class="menu-row__open" data-open="${item.id}" aria-label="Ver ${item.name}">
          <span class="menu-row__img-wrap">
            ${item.image
              ? `<img src="${item.image}" alt="${item.name}" loading="lazy" />`
              : `<span class="menu-row__placeholder"><img src="assets/logo.png" alt="" /></span>`
            }
          </span>
          <span class="menu-row__body">
            <span class="menu-row__name">${item.name}</span>
            <span class="menu-row__desc">${item.desc}</span>
            ${item.badge ? `<span class="menu-row__badge ${item.restriction ? "restrict" : ""}">${item.badge}</span>` : ""}
          </span>
        </button>
        <div class="menu-row__aside">
          <span class="menu-row__price">${money(item.price)}</span>
          ${qty > 0
            ? `<div class="qty-control">
                 <button data-action="dec" data-id="${item.id}" aria-label="Quitar uno">−</button>
                 <span class="text-sm w-4 text-center">${qty}</span>
                 <button data-action="inc" data-id="${item.id}" aria-label="Agregar uno">+</button>
               </div>`
            : restricted
              ? `<span class="menu-row__note">${restrictionMessage(item)}</span>`
              : `<button class="add-btn-icon" data-action="add" data-id="${item.id}" aria-label="Agregar ${item.name}">+</button>`
          }
        </div>
      </div>
    </li>
  `;
}

function isRestricted(item) {
  if (!item.restriction) return false;
  if (item.restriction === "dineInOnly") return serviceType && serviceType !== "local";
  if (item.restriction === "noTakeout") return serviceType && serviceType !== "local";
  return false;
}

function restrictionMessage(item) {
  if (item.restriction === "dineInOnly") return "Solo disponible comiendo en el local";
  if (item.restriction === "noTakeout") return "Solo disponible en el local";
  return "";
}

/* ---------------- CART LOGIC ---------------- */
function addItem(id) {
  const item = findItem(id);
  if (!item) return;

  if (!serviceType) {
    pendingAddId = id;
    closeDetail();
    openCart();
    showToast("Elige tu tipo de servicio y agregamos el producto 🌮");
    return;
  }
  if (isRestricted(item)) {
    showToast(`"${item.name}" ${restrictionMessage(item).toLowerCase()}.`);
    return;
  }
  cart[id] = (cart[id] || 0) + 1;
  refreshAll();
}

function decItem(id) {
  if (!cart[id]) return;
  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];
  refreshAll();
}

function removeItem(id) {
  delete cart[id];
  refreshAll();
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = findItem(id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
}

function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

/* When service type changes, strip now-restricted items */
function enforceServiceRestrictions() {
  let removedNames = [];
  for (const id of Object.keys(cart)) {
    const item = findItem(id);
    if (item && isRestricted(item)) {
      removedNames.push(item.name);
      delete cart[id];
    }
  }
  if (removedNames.length) {
    showToast(`Se quitaron del carrito (no disponibles para ${SERVICE_LABELS[serviceType]}): ${removedNames.join(", ")}`);
  }
}

/* ---------------- RENDER CART ---------------- */
function renderCart() {
  const container = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("cartEmptyMsg");
  const entries = Object.entries(cart);

  emptyMsg.classList.toggle("hidden", entries.length > 0);
  container.innerHTML = entries.map(([id, qty]) => {
    const item = findItem(id);
    return `
      <div class="cart-line">
        <div class="flex-1">
          <p class="cart-line__name">${item.name}</p>
          <p class="cart-line__price">${qty} × ${money(item.price)} = ${money(item.price * qty)}</p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <div class="qty-control">
            <button data-action="dec" data-id="${id}" aria-label="Quitar uno">−</button>
            <span class="text-sm w-4 text-center">${qty}</span>
            <button data-action="inc" data-id="${id}" aria-label="Agregar uno">+</button>
          </div>
          <button class="cart-line__remove" data-action="remove" data-id="${id}">Quitar</button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("cartTotal").textContent = money(cartTotal());

  const badge = document.getElementById("cartBadge");
  const count = cartCount();
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);

  updateServiceButtons();
  updateFlowSections();
  updateCheckoutState();
}

function updateServiceButtons() {
  document.querySelectorAll(".service-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.service === serviceType);
  });
}

function updateFlowSections() {
  const deliveryBox = document.getElementById("deliveryDetails");
  const paymentBox = document.getElementById("paymentSection");
  const contactBox = document.getElementById("contactSection");
  const hasItems = cartCount() > 0;

  deliveryBox.classList.toggle("hidden", !(serviceType === "domicilio" && hasItems));
  paymentBox.classList.toggle("hidden", !(serviceType && hasItems));
  contactBox.classList.toggle("hidden", !(serviceType && hasItems));

  if (serviceType && hasItems) renderPaymentOptions();
}

function renderPaymentOptions() {
  const container = document.getElementById("paymentOptions");
  const yappyBox = document.getElementById("yappyBox");

  let options;
  if (serviceType === "local") {
    options = [
      { id: "efectivo", label: "Efectivo" },
      { id: "yappy", label: "Yappy" },
    ];
  } else {
    options = [{ id: "yappy", label: "Yappy (obligatorio)" }];
    if (paymentMethod !== "yappy") paymentMethod = "yappy";
  }

  container.innerHTML = options.map(opt => `
    <button type="button" class="pay-btn ${paymentMethod === opt.id ? "active" : ""}" data-pay="${opt.id}">
      ${opt.label}
    </button>
  `).join("");

  const isYappy = paymentMethod === "yappy";
  yappyBox.classList.toggle("hidden", !isYappy);
  
  if (isYappy) paintAckBtn();
}

function paintAckBtn() {
  const ackBtn = document.getElementById("yappyAckBtn");
  if (!ackBtn) return;
  ackBtn.classList.toggle("is-ack", yappyAcknowledged);
  ackBtn.querySelector("span").textContent = yappyAcknowledged
    ? "✓ ¡Listo! Enviaré mi comprobante por WhatsApp"
    : "✓ Entendido, enviaré mi comprobante al WhatsApp";
}

/* ---------------- CHECKOUT VALIDATION ---------------- */
function updateCheckoutState() {
  const btn = document.getElementById("checkoutBtn");
  btn.disabled = !isCheckoutReady();
}

function isCheckoutReady() {
  if (cartCount() === 0) return false;
  if (!serviceType) return false;
  if (!paymentMethod) return false;

  if (serviceType === "domicilio") {
    const addr = document.getElementById("addressInput").value.trim();
    if (!addr) return false;
  }

  if (paymentMethod === "yappy") {
    if (!yappyAcknowledged) return false; // Exige haber presionado el botón de entendido
  }
  return true;
}

/* ---------------- CART DRAWER OPEN/CLOSE ---------------- */
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.remove("hidden");
}
function closeCart() {
  if (!serviceType) pendingAddId = null;
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.add("hidden");
}

/* ---------------- GEOLOCATION ---------------- */
function useGPS() {
  const status = document.getElementById("gpsStatus");
  const gpsBtn = document.getElementById("gpsBtn");
  if (!navigator.geolocation) {
    status.textContent = "Tu navegador no soporta geolocalización. Escribe tu dirección manualmente.";
    status.classList.remove("hidden");
    return;
  }
  status.textContent = "Obteniendo tu ubicación con la mayor precisión posible…";
  status.classList.remove("hidden");
  gpsBtn.disabled = true;

  let bestPos = null;
  let watchId = null;
  let settled = false;

  const finish = (pos, timedOut) => {
    if (settled) return;
    settled = true;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    gpsBtn.disabled = false;

    if (!pos) {
      status.textContent = "No pudimos obtener tu ubicación. Verifica que el GPS esté activado o escribe tu dirección manualmente.";
      return;
    }

    const { latitude, longitude, accuracy } = pos.coords;
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    deliveryAddress = `Ubicación GPS: ${mapsLink}`;
    document.getElementById("addressInput").value = deliveryAddress;

    const accText = accuracy ? ` (precisión aprox. ±${Math.round(accuracy)} m)` : "";
    if (accuracy && accuracy > 100) {
      status.textContent = `Ubicación capturada${accText}. La precisión es baja: si el punto no coincide con tu casa, agrega una referencia extra en el cuadro de abajo.`;
    } else {
      status.textContent = `Ubicación capturada correctamente ✅${accText}`;
    }
    updateCheckoutState();
  };

  const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) bestPos = pos;
      if (pos.coords.accuracy && pos.coords.accuracy <= 30) finish(pos, false);
    },
    () => finish(bestPos, false),
    options
  );

  setTimeout(() => finish(bestPos, true), 6000);
}

function buildWhatsAppMessage() {
  const name = document.getElementById("customerName").value.trim() || "Cliente";
  const address = document.getElementById("addressInput").value.trim();

  const lines = [];
  lines.push(`*Nuevo pedido — Ajolote Fonda Mexicana*`);
  lines.push(`Cliente: ${name}`);
  lines.push(`Tipo de servicio: ${SERVICE_LABELS[serviceType]}`);
  if (serviceType === "domicilio") {
    lines.push(`Dirección: ${address}`);
  }
  lines.push("");
  lines.push("*Pedido:*");
  Object.entries(cart).forEach(([id, qty]) => {
    const item = findItem(id);
    lines.push(`• ${qty}x ${item.name} — ${money(item.price * qty)}`);
  });
  lines.push("");
  lines.push(`Total: ${money(cartTotal())}`);
  lines.push(`Método de pago: ${paymentMethod === "yappy" ? "Yappy" : "Efectivo"}`);
  if (paymentMethod === "yappy") {
    lines.push(`_(Comprobante de pago adjunto en este chat)_`);
  }
  return lines.join("\n");
}

function sendToWhatsApp() {
  if (!isCheckoutReady()) return;
  const message = buildWhatsAppMessage();

  const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
  const win = window.open(url, "_blank");
  if (!win) window.location.href = url; // si el navegador bloquea la ventana emergente

  showToast("¡Pedido enviado! Confírmalo por WhatsApp. 🌮");
  resetOrderAfterSend();
}

function resetOrderAfterSend() {
  cart = {};
  serviceType = null;
  paymentMethod = null;
  yappyAcknowledged = false;
  deliveryAddress = "";
  pendingAddId = null;
  document.getElementById("addressInput").value = "";
  document.getElementById("customerName").value = "";
  const gps = document.getElementById("gpsStatus");
  gps.textContent = "";
  gps.classList.add("hidden");
  closeCart();
  refreshAll();
}



/* ---------------- ITEM DETAIL MODAL ---------------- */
let detailItemId = null;

function openDetail(id) {
  const item = findItem(id);
  if (!item) return;
  detailItemId = id;

  document.getElementById("detailImgWrap").innerHTML = item.image
    ? `<img src="${item.image}" alt="${item.name}" />`
    : `<span class="detail-placeholder"><img src="assets/logo.png" alt="" /></span>`;

  document.getElementById("detailName").textContent = item.name;
  document.getElementById("detailPrice").textContent = money(item.price);
  document.getElementById("detailDesc").textContent = item.desc;

  const badgeEl = document.getElementById("detailBadge");
  if (item.badge) {
    badgeEl.textContent = item.badge;
    badgeEl.classList.remove("hidden");
    badgeEl.classList.toggle("restrict", !!item.restriction);
  } else {
    badgeEl.classList.add("hidden");
  }

  const restrictedEl = document.getElementById("detailRestricted");
  const restricted = isRestricted(item);
  if (restricted) {
    restrictedEl.textContent = `${restrictionMessage(item)}.`;
    restrictedEl.classList.remove("hidden");
  } else {
    restrictedEl.classList.add("hidden");
  }

  document.getElementById("detailAddBtn").disabled = restricted;
  document.getElementById("detailQty").textContent = cart[id] || 0;

  const overlay = document.getElementById("detailOverlay");
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  requestAnimationFrame(() => document.getElementById("detailCard").classList.add("open"));
}

function closeDetail() {
  const overlay = document.getElementById("detailOverlay");
  document.getElementById("detailCard").classList.remove("open");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
  }, 200);
}

function refreshDetailQty() {
  if (!detailItemId) return;
  document.getElementById("detailQty").textContent = cart[detailItemId] || 0;
}

/* ---------------- REFRESH ---------------- */
function refreshAll() {
  renderMenu();
  renderCart();
  refreshDetailQty();
}

/* ---------------- FEEDBACK FORM ---------------- */
function loadFeedbackLocal() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFeedbackLocal(entry) {
  const all = loadFeedbackLocal();
  all.unshift(entry);
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all)); } catch (e) { console.warn(e); }
}

function saveFeedback(entry) {
  if (firebaseReady && firestoreDB) {
    firestoreDB.collection("resenas").add({
      ...entry,
      creado: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch((err) => {
      console.error("Error guardando en Firestore:", err);
      showToast("No se pudo enviar tu opinión a la nube; quedó guardada solo en este dispositivo.");
      saveFeedbackLocal(entry);
      renderFeedbackList(loadFeedbackLocal());
    });
  } else {
    saveFeedbackLocal(entry);
    renderFeedbackList(loadFeedbackLocal());
  }
}

function subscribeToFeedback() {
  const note = document.getElementById("feedbackSyncNote");
  if (firebaseReady && firestoreDB) {
    note.classList.add("hidden");
    firestoreDB.collection("resenas").orderBy("creado", "desc").limit(20)
      .onSnapshot(
        (snap) => renderFeedbackList(snap.docs.map((d) => d.data())),
        (err) => {
          console.error("Error leyendo Firestore:", err);
          note.textContent = "No se pudieron cargar las opiniones de la nube; mostrando solo las de este dispositivo.";
          note.classList.remove("hidden");
          renderFeedbackList(loadFeedbackLocal());
        }
      );
  } else {
    note.textContent = "Sincronización en la nube no configurada aún: estas opiniones solo se ven en este dispositivo.";
    note.classList.remove("hidden");
    renderFeedbackList(loadFeedbackLocal());
  }
}

function starsHTML(n) {
  n = Number(n) || 0;
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="${i <= n ? "star-filled" : "star-empty"}">★</span>`;
  }
  return out;
}

function renderFeedbackList(entries) {
  const all = entries || [];
  const list = document.getElementById("feedbackList");
  const empty = document.getElementById("feedbackEmpty");

  empty.classList.toggle("hidden", all.length > 0);
  list.innerHTML = all.slice(0, 20).map(fb => `
    <div class="feedback-item">
      <div class="feedback-item__meta">
        <span class="feedback-item__stars">${starsHTML(fb.estrellas)}</span> · <span>${escapeHTML(fb.comida || "")}</span> · <span>Precios: ${escapeHTML(fb.precios || "")}</span> · <span>${escapeHTML(fb.fecha || "")}</span>
      </div>
      ${fb.consejoComida ? `<p>"${escapeHTML(fb.consejoComida)}"</p>` : ""}
      ${fb.consejoGeneral ? `<p class="mt-1">"${escapeHTML(fb.consejoGeneral)}"</p>` : ""}
    </div>
  `).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/* ---------------- EVENT WIRING ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  renderCart();
  subscribeToFeedback();

  // Menu clicks (event delegation)
  document.querySelectorAll("#menuTacos, #menuPromos, #menuBebidas, #menuPostres").forEach(container => {
    container.addEventListener("click", (e) => {
      const openBtn = e.target.closest("button[data-open]");
      if (openBtn) {
        openDetail(openBtn.dataset.open);
        return;
      }
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === "add") addItem(id);
      if (action === "inc") addItem(id);
      if (action === "dec") decItem(id);
    });
  });

  // Botón de entendido para Yappy
  document.addEventListener("click", (e) => {
    const ackBtn = e.target.closest("#yappyAckBtn");
    if (!ackBtn) return;
    yappyAcknowledged = !yappyAcknowledged;
    paintAckBtn();
    updateCheckoutState();
  });

  // Detail modal
  document.getElementById("closeDetail").addEventListener("click", closeDetail);
  document.getElementById("detailOverlay").addEventListener("click", (e) => {
    if (e.target.id === "detailOverlay") closeDetail();
  });
  document.getElementById("detailAddBtn").addEventListener("click", () => {
    if (detailItemId) addItem(detailItemId);
  });
  document.getElementById("detailQtyControl").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || !detailItemId) return;
    if (btn.dataset.action === "detail-inc") addItem(detailItemId);
    if (btn.dataset.action === "detail-dec") decItem(detailItemId);
  });

  // Tecla Escape cierra modal y carrito
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeDetail();
    closeCart();
  });

  // Cart drawer open/close
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("overlay").addEventListener("click", closeCart);

  // Cart item events
  document.getElementById("cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "inc") addItem(id);
    if (action === "dec") decItem(id);
    if (action === "remove") removeItem(id);
  });

  // Service type buttons
  document.getElementById("serviceButtons").addEventListener("click", (e) => {
    const btn = e.target.closest(".service-btn");
    if (!btn) return;
    serviceType = btn.dataset.service;
    paymentMethod = null;
    yappyAcknowledged = false;
    enforceServiceRestrictions();
    // Si el cliente tocó "+" antes de elegir servicio, lo agregamos ahora
    if (pendingAddId) {
      const pending = findItem(pendingAddId);
      const id = pendingAddId;
      pendingAddId = null;
      if (pending && !isRestricted(pending)) {
        cart[id] = (cart[id] || 0) + 1;
      } else if (pending) {
        showToast(`"${pending.name}" ${restrictionMessage(pending).toLowerCase()}.`);
      }
    }
    refreshAll();
  });

  // Payment options (delegated, re-rendered dynamically)
  document.getElementById("paymentOptions").addEventListener("click", (e) => {
    const btn = e.target.closest(".pay-btn");
    if (!btn) return;
    paymentMethod = btn.dataset.pay;
    if (paymentMethod !== "yappy") yappyAcknowledged = false;
    renderPaymentOptions();
    updateCheckoutState();
  });

  // Address / yappy ref / name inputs affect checkout readiness
  document.getElementById("addressInput").addEventListener("input", updateCheckoutState);
 
  document.getElementById("customerName").addEventListener("input", updateCheckoutState);

  // GPS
  document.getElementById("gpsBtn").addEventListener("click", useGPS);

  // Checkout
  document.getElementById("checkoutBtn").addEventListener("click", sendToWhatsApp);

  // Feedback chips (comida / precios)
  document.querySelectorAll("[data-radio-group]").forEach(group => {
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      group.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
      const groupName = group.dataset.radioGroup;
      const hiddenInput = document.querySelector(`input[name="${groupName}"]`);
      hiddenInput.value = chip.dataset.value;
    });
  });

  // Category quick-nav: filter the menu to just the tapped category
  document.getElementById("catNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-nav__btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
  });

  // Star rating (calificación general de la reseña)
  const starRating = document.getElementById("starRating");
  const starsInput = document.querySelector('input[name="estrellas"]');
  const paintStars = (value) => {
    starRating.querySelectorAll(".star").forEach((s) => {
      s.classList.toggle("is-filled", Number(s.dataset.value) <= value);
    });
  };
  starRating.addEventListener("click", (e) => {
    const btn = e.target.closest(".star");
    if (!btn) return;
    const value = Number(btn.dataset.value);
    starsInput.value = value;
    paintStars(value);
  });
  starRating.addEventListener("mouseover", (e) => {
    const btn = e.target.closest(".star");
    if (btn) paintStars(Number(btn.dataset.value));
  });
  starRating.addEventListener("mouseleave", () => {
    paintStars(Number(starsInput.value) || 0);
  });

  // Feedback form submit
  document.getElementById("feedbackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.estrellas || !data.comida || !data.precios || !data.fuente) {
      showToast("Por favor completa la calificación por estrellas y las preguntas de opción múltiple.");
      return;
    }

    saveFeedback({
      estrellas: Number(data.estrellas),
      fuente: data.fuente,
      comida: data.comida,
      consejoComida: data.consejoComida || "",
      atencion: data.atencion || "",
      ambiente: data.ambiente || "",
      precios: data.precios,
      consejoGeneral: data.consejoGeneral || "",
      fecha: new Date().toLocaleDateString("es-PA"),
    });

    form.reset();
    document.querySelectorAll(".chip--active").forEach(c => c.classList.remove("chip--active"));
    document.querySelectorAll('input[type="hidden"][name="comida"], input[type="hidden"][name="precios"]').forEach(i => i.value = "");
    starsInput.value = "";
    paintStars(0);

    document.getElementById("feedbackThanks").classList.remove("hidden");
    setTimeout(() => document.getElementById("feedbackThanks").classList.add("hidden"), 4000);
  });
});

