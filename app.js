/* ============================================================
   AJOLOTE | FONDA MEXICANA — app.js
   ============================================================ */

const WHATSAPP_NUMBER = "50764163179"; // +507 6892-8541
const FEEDBACK_KEY = "ajolote_opiniones";

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
  retiro: "Retirar en Sucursal",
  domicilio: "Pedido a Domicilio",
};

/* ---------------- STATE ---------------- */
let cart = {};      // { itemId: qty }
let serviceType = null; // 'local' | 'retiro' | 'domicilio'
let paymentMethod = null; // 'efectivo' | 'yappy'
let deliveryAddress = "";
let yappyProofFile = null; // File del comprobante de pago (imagen)

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

function renderCategory(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(itemCardHTML).join("");
}

function itemCardHTML(item) {
  const qty = cart[item.id] || 0;
  const restricted = isRestricted(item);
  return `
    <div class="menu-card" data-item="${item.id}">
      <button class="menu-card__img-wrap" data-open="${item.id}" aria-label="Ver ${item.name}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" loading="lazy" />`
          : `<span class="menu-card__placeholder"><img src="assets/logo.png" alt="" /></span>`
        }
      </button>
      <div class="menu-card__top">
        <button class="menu-card__name text-left" data-open="${item.id}">${item.name}</button>
        <span class="menu-card__price">${money(item.price)}</span>
      </div>
      <p class="menu-card__desc">${item.desc}</p>
      ${item.badge ? `<span class="menu-card__badge ${item.restriction ? "restrict" : ""}">${item.badge}</span>` : ""}
      <div class="menu-card__footer">
        ${qty > 0
          ? `<div class="qty-control">
               <button data-action="dec" data-id="${item.id}" aria-label="Quitar uno">−</button>
               <span class="text-sm w-4 text-center">${qty}</span>
               <button data-action="inc" data-id="${item.id}" aria-label="Agregar uno">+</button>
             </div>`
          : `<span class="text-xs text-muted">${restricted ? restrictionMessage(item) : "Elige tu cantidad"}</span>`
        }
        <button class="add-btn" data-action="add" data-id="${item.id}" ${restricted ? "disabled" : ""}>
          ${qty > 0 ? "Agregar otro" : "Agregar"}
        </button>
      </div>
    </div>
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
    openCart();
    showToast("Primero elige tu tipo de servicio en el carrito 🌮");
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
    // Retiro o domicilio -> Yappy obligatorio y previo
    options = [{ id: "yappy", label: "Yappy (obligatorio)" }];
    if (paymentMethod !== "yappy") paymentMethod = "yappy";
  }

  container.innerHTML = options.map(opt => `
    <button type="button" class="pay-btn ${paymentMethod === opt.id ? "active" : ""}" data-pay="${opt.id}">
      ${opt.label}
    </button>
  `).join("");

  yappyBox.classList.toggle("hidden", paymentMethod !== "yappy");
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
    const ref = document.getElementById("yappyRef").value.trim();
    if (!ref && !yappyProofFile) return false;
  }
  return true;
}

/* ---------------- CART DRAWER OPEN/CLOSE ---------------- */
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.remove("hidden");
}
function closeCart() {
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

  // Track the best (most accurate) fix we get, since a single reading can be
  // imprecise right after enabling location services.
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
      status.textContent = `Ubicación capturada${accText}. La precisión es baja: si el punto no coincide con tu casa, agrega una referencia extra en el cuadro de abajo (ej. "casa color azul, frente a la tienda X").`;
    } else {
      status.textContent = `Ubicación capturada correctamente ✅${accText}`;
    }
    updateCheckoutState();
  };

  const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

  // watchPosition lets the device refine the fix (common on phones, the first
  // reading right after requesting permission is often the least accurate).
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) bestPos = pos;
      // Good enough accuracy — stop early instead of waiting out the full timeout.
      if (pos.coords.accuracy && pos.coords.accuracy <= 30) finish(pos, false);
    },
    () => finish(null, false),
    options
  );

  // Stop refining after a few seconds and use the best fix obtained so far.
  setTimeout(() => finish(bestPos, true), 6000);
}

/* ---------------- COMPROBANTE DE PAGO (YAPPY) ---------------- */
function handleYappyProofSelected(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Selecciona un archivo de imagen (foto o captura de pantalla).");
    return;
  }
  yappyProofFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("yappyProofPreview").src = reader.result;
    document.getElementById("yappyProofPreviewWrap").classList.remove("hidden");
    document.getElementById("yappyProofLabel").classList.add("hidden");
  };
  reader.readAsDataURL(file);
  updateCheckoutState();
}

function clearYappyProof() {
  yappyProofFile = null;
  document.getElementById("yappyProofInput").value = "";
  document.getElementById("yappyProofPreview").src = "";
  document.getElementById("yappyProofPreviewWrap").classList.add("hidden");
  document.getElementById("yappyProofLabel").classList.remove("hidden");
  updateCheckoutState();
}

/* ---------------- WHATSAPP MESSAGE ---------------- */
function buildWhatsAppMessage() {
  const name = document.getElementById("customerName").value.trim() || "Cliente";
  const address = document.getElementById("addressInput").value.trim();
  const yappyRef = document.getElementById("yappyRef").value.trim();

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
    if (yappyRef) lines.push(`Referencia de pago Yappy: ${yappyRef}`);
    if (yappyProofFile) lines.push(`(Comprobante de pago adjunto)`);
  }
  return lines.join("\n");
}

async function sendToWhatsApp() {
  if (!isCheckoutReady()) return;
  const message = buildWhatsAppMessage();

  // If the browser supports sharing files (most mobile browsers), share the
  // order text together with the payment proof photo in one step, letting
  // the person pick WhatsApp from the native share sheet.
  if (yappyProofFile && navigator.canShare && navigator.canShare({ files: [yappyProofFile] })) {
    try {
      await navigator.share({
        text: message,
        title: "Pedido Ajolote Fonda Mexicana",
        files: [yappyProofFile],
      });
      showToast("¡Listo! Envía el pedido y la foto del comprobante por WhatsApp. 🌮");
      resetOrderAfterSend();
      return;
    } catch (err) {
      // User cancelled the share sheet or it failed — fall back below.
      if (err && err.name === "AbortError") return;
    }
  }

  // Fallback: open WhatsApp with the order text pre-filled. The wa.me link
  // can't attach an image automatically, so if there's a proof photo we
  // save it to the device and ask the person to attach it manually.
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  if (yappyProofFile) {
    const proofUrl = URL.createObjectURL(yappyProofFile);
    const link = document.createElement("a");
    link.href = proofUrl;
    link.download = "comprobante-yappy" + (yappyProofFile.name.match(/\.\w+$/)?.[0] || ".jpg");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(proofUrl), 5000);
    showToast("Abrimos WhatsApp y guardamos tu comprobante. No olvides adjuntar la foto al chat. 📎");
  } else {
    showToast("¡Pedido enviado! Confírmalo por WhatsApp. 🌮");
  }
  resetOrderAfterSend();
}

function resetOrderAfterSend() {
  cart = {};
  paymentMethod = null;
  deliveryAddress = "";
  document.getElementById("addressInput").value = "";
  document.getElementById("yappyRef").value = "";
  document.getElementById("customerName").value = "";
  clearYappyProof();
  renderMenu();
  renderCart();
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
function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFeedback(entry) {
  const all = loadFeedback();
  all.unshift(entry);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
}

function renderFeedbackList() {
  const all = loadFeedback();
  const list = document.getElementById("feedbackList");
  const empty = document.getElementById("feedbackEmpty");

  empty.classList.toggle("hidden", all.length > 0);
  list.innerHTML = all.slice(0, 12).map(fb => `
    <div class="feedback-item">
      <div class="feedback-item__meta">
        <span>${fb.comida}</span> · <span>Precios: ${fb.precios}</span> · <span>${fb.fecha}</span>
      </div>
      ${fb.consejoComida ? `<p>"${escapeHTML(fb.consejoComida)}"</p>` : ""}
    </div>
  `).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- EVENT WIRING ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  renderCart();
  renderFeedbackList();

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
    enforceServiceRestrictions();
    refreshAll();
  });

  // Payment options (delegated, re-rendered dynamically)
  document.getElementById("paymentOptions").addEventListener("click", (e) => {
    const btn = e.target.closest(".pay-btn");
    if (!btn) return;
    paymentMethod = btn.dataset.pay;
    renderPaymentOptions();
    updateCheckoutState();
  });

  // Address / yappy ref / name inputs affect checkout readiness
  document.getElementById("addressInput").addEventListener("input", updateCheckoutState);
  document.getElementById("yappyRef").addEventListener("input", updateCheckoutState);
  document.getElementById("customerName").addEventListener("input", updateCheckoutState);

  // Yappy payment proof (photo)
  document.getElementById("yappyProofInput").addEventListener("change", (e) => {
    handleYappyProofSelected(e.target.files[0]);
  });
  document.getElementById("yappyProofRemove").addEventListener("click", clearYappyProof);

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

  // Category quick-nav: highlight the section currently in view
  const catButtons = document.querySelectorAll("#catNav .cat-nav__btn");
  if (catButtons.length) {
    const sections = Array.from(catButtons)
      .map(btn => document.getElementById(btn.dataset.cat))
      .filter(Boolean);

    const setActive = (id) => {
      catButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.cat === id));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(sec => observer.observe(sec));
  }

  // Feedback form submit
  document.getElementById("feedbackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.comida || !data.precios || !data.fuente) {
      showToast("Por favor completa las preguntas de opción múltiple.");
      return;
    }

    saveFeedback({
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

    document.getElementById("feedbackThanks").classList.remove("hidden");
    setTimeout(() => document.getElementById("feedbackThanks").classList.add("hidden"), 4000);

    renderFeedbackList();
  });
});
