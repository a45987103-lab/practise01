const products = {
  "hamster-home": {
    name: "窩心小屋擺飾",
    price: 320,
    emoji: "🏠",
    artClass: "art-home",
  },
  "hamster-plush": {
    name: "倉鼠抱抱吊飾",
    price: 180,
    emoji: "🧸",
    artClass: "art-plush",
  },
  "melon-drink": {
    name: "瓜瓜奶霜特調",
    price: 150,
    emoji: "🍈",
    artClass: "art-melon",
  },
  "berry-drink": {
    name: "莓莓啵啵特調",
    price: 160,
    emoji: "🍓",
    artClass: "art-berry",
  },
};

const storageKey = "hamster-shop-cart";
const cart = loadCart();
const cartDrawer = document.querySelector("#cart-drawer");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartTrigger = document.querySelector(".cart-trigger");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartFooter = document.querySelector(".cart-footer");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total strong");
const cartStatus = document.querySelector(".cart-status");
const cartClose = document.querySelector(".cart-close");
let statusTimeout;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!savedCart || typeof savedCart !== "object" || Array.isArray(savedCart)) {
      throw new TypeError("購物車資料格式錯誤。");
    }

    return Object.fromEntries(
      Object.entries(savedCart).filter(([id, quantity]) =>
        Object.hasOwn(products, id) && Number.isSafeInteger(quantity) && quantity > 0
      )
    );
  } catch (error) {
    console.error("無法讀取已儲存的購物車：", error);
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch (error) {
    console.error("無法儲存購物車：", error);
    showStatus("購物車無法儲存到這個瀏覽器，請稍後再試。");
  }
}

function formatPrice(price) {
  return `NT$ ${price.toLocaleString("zh-TW")}`;
}

function renderCart() {
  const entries = Object.entries(cart);
  const itemCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const total = entries.reduce(
    (sum, [id, quantity]) => sum + products[id].price * quantity,
    0
  );

  cartCount.textContent = itemCount;
  cartTrigger.setAttribute("aria-label", `開啟購物車，${itemCount} 件商品`);
  cartEmpty.hidden = itemCount > 0;
  cartFooter.hidden = itemCount === 0;
  cartTotal.textContent = formatPrice(total);
  cartItems.innerHTML = entries.map(([id, quantity]) => {
    const product = products[id];
    return `
      <article class="cart-item">
        <div class="cart-item-art ${product.artClass}" aria-hidden="true">${product.emoji}</div>
        <div>
          <h3>${product.name}</h3>
          <span class="cart-item-price">${formatPrice(product.price)}</span>
          <div class="cart-item-controls">
            <button class="quantity-button" type="button" data-action="decrease" data-product-id="${id}" aria-label="減少${product.name}數量">−</button>
            <span class="quantity-value">${quantity}</span>
            <button class="quantity-button" type="button" data-action="increase" data-product-id="${id}" aria-label="增加${product.name}數量">+</button>
            <button class="remove-item" type="button" data-action="remove" data-product-id="${id}">移除</button>
          </div>
        </div>
        <strong class="cart-item-subtotal">${formatPrice(product.price * quantity)}</strong>
      </article>
    `;
  }).join("");
}

function openCart() {
  cartDrawer.hidden = false;
  cartBackdrop.hidden = false;
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  cartClose.focus();
}

function closeCart() {
  cartDrawer.hidden = true;
  cartBackdrop.hidden = true;
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  cartTrigger.focus();
}

function showStatus(message) {
  cartStatus.textContent = message;
  cartStatus.classList.add("is-visible");
  window.clearTimeout(statusTimeout);
  statusTimeout = window.setTimeout(() => {
    cartStatus.classList.remove("is-visible");
  }, 2800);
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.productId;
    if (!Object.hasOwn(products, id)) {
      console.error(`找不到商品：${id}`);
      return;
    }
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    showStatus(`已將「${products[id].name}」加入購物車`);
  });
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, productId } = button.dataset;
  if (!Object.hasOwn(cart, productId)) return;

  if (action === "increase") {
    cart[productId] += 1;
  } else if (action === "decrease") {
    cart[productId] -= 1;
    if (cart[productId] <= 0) delete cart[productId];
  } else if (action === "remove") {
    delete cart[productId];
  }

  saveCart();
  renderCart();
});

cartTrigger.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

document.querySelector(".cart-continue").addEventListener("click", () => {
  closeCart();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  showStatus("此為展示商店，尚未串接金流，沒有建立訂單。");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !cartDrawer.hidden) closeCart();
});

renderCart();
