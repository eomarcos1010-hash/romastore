const PRODUCTS_KEY = "roma_store_products";
const CATEGORIES_KEY = "roma_store_categories";
const CONFIG_KEY = "roma_store_config";

const defaultProducts = [
  {
    id: 1,
    name: "Otimização Avançada",
    category: "otimizacao",
    price: 34.99,
    oldPrice: 45,
    rating: "5.0",
    image: "assets/otimizacao-avancada.png",
    images: [],
    purchaseLink: "#",
    descriptionTitle: "OTIMIZAÇÃO AVANÇADA",
    description:
      "A Otimização Avançada é indicada para quem busca mais desempenho, estabilidade e resposta no computador."
  }
];

const defaultCategories = [
  {
    id: "otimizacao",
    name: "Otimização",
    image: "assets/categorias/otimizacao.png"
  },
  {
    id: "windows",
    name: "Windows",
    image: "assets/categorias/windows.png"
  },
  {
    id: "personalizacao",
    name: "Personalização",
    image: "assets/categorias/personalizacao.png"
  },
  {
    id: "ferramentas",
    name: "Ferramentas",
    image: "assets/categorias/ferramentas.png"
  }
];

const defaultConfig = {
  storeName: "roma store",
  storeDescription: "Sua loja de tecnologia.",

  // IMAGEM DA RAIZ DO PROJETO
  heroImage: "Identidade Visual Roma Store.png",

  discord: "https://discord.gg/eKUaZD97aD",
  whatsapp: "https://wa.me/5561999069108",
  tiktok: "https://www.tiktok.com/@roma.zx0",
  instagram: "https://www.instagram.com/roma.zx0/"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    return saved
      ? JSON.parse(saved)
      : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

let products = load(
  PRODUCTS_KEY,
  defaultProducts
);

let categories = load(
  CATEGORIES_KEY,
  defaultCategories
);

let config = {
  ...defaultConfig,
  ...load(CONFIG_KEY, defaultConfig)
};

let selectedCategory = "todos";
let selectedProduct = null;
let currentImageIndex = 0;
let cart = [];

const $ = id => document.getElementById(id);

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}

function discountValue(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) {
    return 0;
  }

  return Math.round(
    (1 - price / oldPrice) * 100
  );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    applyStoreConfig();
    renderCategories();
    setupSupport();
    setupCart();
    setupSearch();
    setupNavigation();
    renderProducts();
  }
);


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function applyStoreConfig() {

  if ($("brandName")) {
    $("brandName").textContent =
      config.storeName || "roma store";
  }

  if ($("footerBrandName")) {
    $("footerBrandName").textContent =
      config.storeName || "roma store";
  }

  if ($("footerDescription")) {
    $("footerDescription").textContent =
      config.storeDescription ||
      "Sua loja de tecnologia.";
  }


  /*
    CORREÇÃO DA IMAGEM DO HERO

    Se o dashboard ainda tiver salvo o caminho antigo:
    assets/Identidade Visual Roma Store.png

    ele será automaticamente convertido para:
    Identidade Visual Roma Store.png
  */

  if ($("heroImage")) {

    if (
      config.heroImage ===
      "assets/Identidade Visual Roma Store.png"
    ) {
      config.heroImage =
        "Identidade Visual Roma Store.png";

      localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify(config)
      );
    }

    $("heroImage").src =
      config.heroImage ||
      "Identidade Visual Roma Store.png";
  }


  if ($("discordLink")) {
    $("discordLink").href =
      config.discord || "#";
  }

  if ($("whatsappLink")) {
    $("whatsappLink").href =
      config.whatsapp || "#";
  }

  if ($("tiktokLink")) {
    $("tiktokLink").href =
      config.tiktok || "#";
  }

  if ($("instagramLink")) {
    $("instagramLink").href =
      config.instagram || "#";
  }

  if ($("ratingStoreName")) {
    $("ratingStoreName").textContent =
      config.storeName ||
      "Roma Store";
  }
}


/* =========================================================
   CATEGORIAS
========================================================= */

function renderCategories() {

  const list = $("categoriesList");

  if (!list) return;

  list.innerHTML = "";

  const allButton =
    document.createElement("button");

  allButton.className =
    "category-button category-cover-all";

  allButton.dataset.category = "todos";
  allButton.type = "button";

  allButton.innerHTML = `
    <span class="category-overlay"></span>

    <span class="category-name">
      Todos
    </span>
  `;

  allButton.addEventListener(
    "click",
    () => {

      selectedCategory = "todos";

      updateCategoryState();

      renderProducts();
    }
  );

  list.appendChild(allButton);


  categories.forEach(category => {

    const button =
      document.createElement("button");

    button.className =
      "category-button";

    button.dataset.category =
      category.id;

    button.type = "button";


    const image =
      category.image ||
      "assets/categorias/default.png";


    button.innerHTML = `
      <img
        class="category-cover"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(category.name)}"
        onerror="this.style.display='none'"
      >

      <span class="category-overlay"></span>

      <span class="category-name">
        ${escapeHTML(category.name)}
      </span>
    `;


    button.addEventListener(
      "click",
      () => {
        openCategoryPage(category.id);
      }
    );


    list.appendChild(button);
  });


  updateCategoryState();
}


function updateCategoryState() {

  document
    .querySelectorAll(".category-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
          selectedCategory
      );
    });
}


function getVisibleProducts() {

  return products.filter(product => {

    if (
      product.status ===
      "inactive"
    ) {
      return false;
    }


    if (
      selectedCategory ===
      "todos"
    ) {
      return true;
    }


    return (
      product.category ===
      selectedCategory
    );
  });
}


/* =========================================================
   PÁGINA DA CATEGORIA
========================================================= */

function openCategoryPage(categoryId) {

  const category =
    categories.find(
      item => item.id === categoryId
    );

  if (!category) return;


  const categoryProducts =
    products.filter(product => {

      return (
        product.status !== "inactive" &&
        product.category === categoryId
      );
    });


  const categoryWindow =
    window.open("", "_blank");


  if (!categoryWindow) {

    alert(
      "Permita pop-ups no navegador para abrir a categoria."
    );

    return;
  }


  const productsHTML =
    categoryProducts.length

      ? categoryProducts
          .map((product, index) => {

            return `
              <article
                class="category-product-card"
                style="animation-delay: ${index * 0.09}s"
              >

                <img
                  class="category-product-image"
                  src="${escapeHTML(
                    product.image || ""
                  )}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                  onerror="this.style.display='none'"
                >

                <div class="category-product-info">

                  <h3>
                    ${escapeHTML(
                      product.name
                    )}
                  </h3>

                  <div class="category-product-price">
                    ${money(product.price)}
                  </div>

                  <button
                    class="category-product-button"
                    type="button"
                    data-product-id="${product.id}"
                  >
                    Ver produto
                  </button>

                </div>

              </article>
            `;
          })
          .join("")

      : `
        <div class="category-empty">

          <h2>
            Nenhum produto encontrado
          </h2>

          <p>
            Essa categoria ainda não possui produtos.
          </p>

        </div>
      `;


  categoryWindow.document.write(`

    <!DOCTYPE html>

    <html lang="pt-BR">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>
        ${escapeHTML(category.name)}
        - Roma Store
      </title>


      <style>

        ${getCategoryPageCSS()}

      </style>

    </head>


    <body>

      <main class="category-page">

        <header
          class="category-page-header"
        >

          <div>

            <span
              class="category-page-label"
            >
              ROMA STORE
            </span>

            <h1>
              ${escapeHTML(
                category.name
              )}
            </h1>

            <p>
              Confira os produtos disponíveis nesta categoria.
            </p>

          </div>


          <button
            class="back-store-button"
            id="backStoreButton"
            type="button"
          >
            ← Voltar para a loja
          </button>

        </header>


        <section
          class="category-products-grid"
        >

          ${productsHTML}

        </section>

      </main>


      <script>

        document
          .getElementById(
            "backStoreButton"
          )
          .addEventListener(
            "click",
            () => {
              window.close();
            }
          );


        document
          .querySelectorAll(
            "[data-product-id]"
          )
          .forEach(button => {

            button.addEventListener(
              "click",
              () => {

                const productId =
                  Number(
                    button.dataset
                      .productId
                  );


                if (
                  window.opener &&
                  !window.opener.closed &&
                  typeof window
                    .opener
                    .openProductFromCategory ===
                    "function"
                ) {

                  window
                    .opener
                    .openProductFromCategory(
                      productId
                    );

                  window.close();
                }

              }
            );

          });

      <\/script>

    </body>

    </html>

  `);

  categoryWindow.document.close();
}


function getCategoryPageCSS() {

  return `

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }


    body {
      min-height: 100vh;

      background:
        radial-gradient(
          circle at 80% 0%,
          rgba(103, 44, 207, 0.12),
          transparent 32%
        ),
        #08070f;

      color: #f5f2ff;

      font-family: Arial, sans-serif;
    }


    button {
      font: inherit;
      cursor: pointer;
    }


    .category-page {
      min-height: 100vh;
      padding: 35px 6%;

      animation:
        categoryPageEnter
        0.45s
        ease
        both;
    }


    .category-page-header {
      display: flex;

      align-items: center;
      justify-content: space-between;

      gap: 20px;

      margin-bottom: 35px;
    }


    .category-page-header h1 {
      font-size:
        clamp(
          25px,
          4vw,
          36px
        );

      margin: 8px 0;
    }


    .category-page-header p {
      color: #9690ad;
      font-size: 13px;
    }


    .category-page-label {
      color: #a879ff;

      font-size: 10px;

      font-weight: 800;

      letter-spacing: 2px;
    }


    .back-store-button {
      border:
        1px solid
        #3b2a65;

      border-radius: 12px;

      padding: 13px 18px;

      background: #151126;

      color: white;

      cursor: pointer;

      font-weight: 700;

      transition:
        0.3s ease;
    }


    .back-store-button:hover {
      background: #29184b;

      border-color:
        #a879ff;

      transform:
        translateY(-3px);
    }


    .category-products-grid {
      display: grid;

      grid-template-columns:
        repeat(
          auto-fill,
          minmax(
            230px,
            1fr
          )
        );

      gap: 20px;
    }


    .category-product-card {
      overflow: hidden;

      border:
        1px solid
        #29213f;

      border-radius: 18px;

      background:
        linear-gradient(
          145deg,
          #151126,
          #0e0c18
        );

      opacity: 0;

      animation:
        categoryProductEnter
        0.6s
        ease
        forwards;

      transition:
        0.3s ease;
    }


    .category-product-card:hover {
      transform:
        translateY(-8px);

      border-color:
        #7c3cff;

      box-shadow:
        0 18px 45px
        rgba(
          124,
          60,
          255,
          0.18
        );
    }


    .category-product-image {
      width: 100%;
      height: 220px;

      display: block;

      object-fit: contain;

      padding: 18px;

      background: #0b0913;

      border-bottom:
        1px solid
        #29213f;
    }


    .category-product-info {
      padding: 18px;
    }


    .category-product-info h3 {
      font-size: 15px;
      line-height: 1.5;

      margin-bottom: 12px;
    }


    .category-product-price {
      color: #36d399;

      font-size: 20px;

      font-weight: 800;

      margin-bottom: 16px;
    }


    .category-product-button {
      width: 100%;

      min-height: 43px;

      border: 0;

      border-radius: 10px;

      background:
        linear-gradient(
          135deg,
          #7135ff,
          #4b17d5
        );

      color: white;

      font-size: 12px;

      font-weight: 800;

      transition:
        0.3s ease;
    }


    .category-product-button:hover {
      filter: brightness(1.2);

      transform:
        translateY(-2px);
    }


    .category-empty {
      padding: 65px 20px;

      border:
        1px dashed
        #3a2d53;

      border-radius: 18px;

      text-align: center;

      color: #9690ad;
    }


    @keyframes categoryPageEnter {

      from {
        opacity: 0;
        transform:
          translateX(30px);
      }

      to {
        opacity: 1;
        transform:
          translateX(0);
      }

    }


    @keyframes categoryProductEnter {

      from {
        opacity: 0;
        transform:
          translateY(30px)
          scale(0.96);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }

    }


    @media (max-width: 650px) {

      .category-page {
        padding: 25px 15px;
      }


      .category-page-header {
        align-items: flex-start;

        flex-direction: column;
      }


      .category-products-grid {
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );

        gap: 12px;
      }


      .category-product-image {
        height: 145px;
        padding: 10px;
      }


      .category-product-info {
        padding: 12px;
      }


      .category-product-info h3 {
        font-size: 12px;
      }


      .category-product-price {
        font-size: 16px;
      }


      .category-product-button {
        min-height: 38px;
        font-size: 10px;
      }

    }


    @media (prefers-reduced-motion: reduce) {

      *,
      *::before,
      *::after {

        animation-duration:
          0.01ms !important;

        transition-duration:
          0.01ms !important;

      }

    }

  `;
}


/* =========================================================
   PRODUTOS
========================================================= */

function createProductCard(
  product,
  index = 0
) {

  const card =
    document.createElement("article");

  card.className =
    "product-card";

  card.tabIndex = 0;

  card.style.animationDelay =
    `${index * 0.08}s`;

  card.setAttribute(
    "role",
    "button"
  );

  card.setAttribute(
    "aria-label",
    `Ver ${product.name}`
  );


  card.innerHTML = `

    <h3>
      ${escapeHTML(product.name)}
    </h3>

    <span class="arrow">
      ›
    </span>

  `;


  card.addEventListener(
    "click",
    () => {
      openProduct(product.id);
    }
  );


  card.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openProduct(product.id);
      }

    }
  );


  return card;
}


function renderProducts(
  list = getVisibleProducts()
) {

  const grid =
    $("productsGrid");

  const empty =
    $("emptyState");

  const count =
    $("productCount");


  if (!grid) return;


  grid.innerHTML = "";


  if (count) {

    count.textContent =
      `${list.length} produtos`;
  }


  if (empty) {

    empty.hidden =
      list.length !== 0;
  }


  list.forEach(
    (product, index) => {

      grid.appendChild(
        createProductCard(
          product,
          index
        )
      );

    }
  );
}


function setupSearch() {

  const searchInput =
    $("searchInput");

  if (!searchInput) return;


  searchInput.addEventListener(
    "input",
    () => {

      const term =
        searchInput.value
          .toLowerCase()
          .trim();


      const filtered =
        getVisibleProducts()
          .filter(product => {

            return `

              ${product.name}

              ${product.category}

              ${product.description || ""}

            `
              .toLowerCase()
              .includes(term);

          });


      renderProducts(filtered);
    }
  );
}


/* =========================================================
   DETALHES DO PRODUTO
========================================================= */

function openProduct(id) {

  selectedProduct =
    products.find(
      product =>
        product.id === id
    );


  if (!selectedProduct) return;


  currentImageIndex = 0;


  $("homePage").hidden = true;

  $("productPage").hidden = false;


  renderProductDetails();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function openProductFromCategory(id) {

  openProduct(id);

  window.focus();
}


function renderProductDetails() {

  const product =
    selectedProduct;


  if (!product) return;


  $("detailName").textContent =
    product.name;


  $("detailCategory").textContent =
    getCategoryName(
      product.category
    );


  $("detailRating").textContent =
    product.rating || "5.0";


  $("detailPrice").textContent =
    money(product.price);


  $("detailOldPrice").textContent =
    Number(product.oldPrice) >
    Number(product.price)
      ? money(product.oldPrice)
      : "";


  const discount =
    discountValue(
      Number(product.price),
      Number(product.oldPrice)
    );


  $("detailDiscount").textContent =
    discount > 0
      ? `${discount}% OFF`
      : "";


  $("descriptionTitle").textContent =
    product.descriptionTitle ||
    product.name;


  $("longDescription").textContent =
    product.description || "";


  renderGallery();
}


function getCategoryName(
  categoryId
) {

  const category =
    categories.find(
      item =>
        item.id === categoryId
    );


  return category
    ? category.name
    : categoryId || "Produto";
}


function getProductImages() {

  return [

    selectedProduct.image,

    ...(selectedProduct.images || [])

  ].filter(Boolean);
}


function renderGallery() {

  const images =
    getProductImages();


  if (!images.length) {

    $("detailImage")
      .removeAttribute("src");

    $("thumbnails")
      .innerHTML = "";

    $("imageCounter")
      .textContent = "";

    return;
  }


  if (
    currentImageIndex >=
    images.length
  ) {

    currentImageIndex = 0;
  }


  $("detailImage").src =
    images[currentImageIndex];


  $("detailImage").alt =
    selectedProduct.name;


  $("imageCounter").textContent =
    `${currentImageIndex + 1} / ${images.length}`;


  const thumbnails =
    $("thumbnails");


  thumbnails.innerHTML = "";


  images.forEach(
    (image, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "thumbnail";


      button.classList.toggle(
        "active",
        index === currentImageIndex
      );


      button.setAttribute(
        "aria-label",
        `Ver imagem ${index + 1}`
      );


      const img =
        document.createElement(
          "img"
        );


      img.src = image;

      img.alt =
        `${selectedProduct.name} - imagem ${index + 1}`;


      button.appendChild(img);


      button.addEventListener(
        "click",
        () => {

          currentImageIndex =
            index;

          renderGallery();

        }
      );


      thumbnails.appendChild(
        button
      );

    }
  );
}


function setupGalleryControls() {

  const nextButton =
    $("nextImage");

  const prevButton =
    $("prevImage");


  if (nextButton) {

    nextButton.addEventListener(
      "click",
      () => {

        const images =
          getProductImages();


        if (!images.length)
          return;


        currentImageIndex =
          (
            currentImageIndex + 1
          ) % images.length;


        renderGallery();

      }
    );

  }


  if (prevButton) {

    prevButton.addEventListener(
      "click",
      () => {

        const images =
          getProductImages();


        if (!images.length)
          return;


        currentImageIndex =
          (
            currentImageIndex -
            1 +
            images.length
          ) % images.length;


        renderGallery();

      }
    );

  }
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {

  if ($("homeLink")) {

    $("homeLink")
      .addEventListener(
        "click",
        event => {

          event.preventDefault();

          goHome();

        }
      );

  }


  if ($("backButton")) {

    $("backButton")
      .addEventListener(
        "click",
        goHome
      );

  }


  setupGalleryControls();
}


function goHome() {

  $("productPage").hidden =
    true;

  $("homePage").hidden =
    false;


  selectedProduct = null;


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   SUPORTE
========================================================= */

function setupSupport() {

  const supportButton =
    $("supportButton");

  const supportPanel =
    $("supportPanel");

  const closeSupport =
    $("closeSupport");


  if (
    !supportButton ||
    !supportPanel
  ) {
    return;
  }


  supportButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      supportPanel.hidden =
        !supportPanel.hidden;


      supportButton.setAttribute(
        "aria-expanded",
        String(
          !supportPanel.hidden
        )
      );

    }
  );


  if (closeSupport) {

    closeSupport.addEventListener(
      "click",
      () => {

        supportPanel.hidden =
          true;

        supportButton.setAttribute(
          "aria-expanded",
          "false"
        );

      }
    );

  }


  document.addEventListener(
    "click",
    event => {

      if (
        !supportPanel.hidden &&
        !supportPanel.contains(
          event.target
        ) &&
        event.target !==
          supportButton
      ) {

        supportPanel.hidden =
          true;

        supportButton.setAttribute(
          "aria-expanded",
          "false"
        );

      }

    }
  );
}


/* =========================================================
   CARRINHO
========================================================= */

function setupCart() {

  const cartButton =
    $("cartButton");

  const closeCartButton =
    $("closeCart");

  const overlay =
    $("overlay");

  const addButton =
    $("addButton");

  const buyButton =
    $("buyButton");

  const checkoutButton =
    $("checkoutButton");


  if (cartButton) {

    cartButton.addEventListener(
      "click",
      openCart
    );

  }


  if (closeCartButton) {

    closeCartButton.addEventListener(
      "click",
      closeCart
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeCart
    );

  }


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        if (!selectedProduct)
          return;


        cart.push(
          selectedProduct
        );


        updateCart();

        openCart();

      }
    );

  }


  if (buyButton) {

    buyButton.addEventListener(
      "click",
      () => {

        if (!selectedProduct)
          return;


        if (
          selectedProduct.purchaseLink &&
          selectedProduct.purchaseLink !== "#"
        ) {

          window.open(
            selectedProduct.purchaseLink,
            "_blank",
            "noopener,noreferrer"
          );

          return;
        }


        alert(
          "O link de compra ainda não foi configurado."
        );

      }
    );

  }


  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      () => {

        if (!cart.length) {

          alert(
            "Seu carrinho está vazio."
          );

          return;
        }


        alert(
          "Pedido selecionado.\n\n" +
          "O pagamento será realizado somente via Pix."
        );

      }
    );

  }


  updateCart();
}


function openCart() {

  $("cartPanel")
    .classList
    .add("open");


  $("overlay").hidden =
    false;
}


function closeCart() {

  $("cartPanel")
    .classList
    .remove("open");


  $("overlay").hidden =
    true;
}


function updateCart() {

  $("cartCount").textContent =
    cart.length;


  if (!cart.length) {

    $("cartItems").innerHTML = `

      <div class="cart-empty">
        Seu carrinho está vazio.
      </div>

    `;


    $("cartTotal").textContent =
      money(0);


    return;
  }


  let total = 0;


  $("cartItems").innerHTML =
    "";


  cart.forEach(
    (product, index) => {

      total +=
        Number(product.price);


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "cart-item";


      item.innerHTML = `

        <div>

          <h4>
            ${escapeHTML(
              product.name
            )}
          </h4>

          <small>
            ${money(product.price)}
          </small>

        </div>


        <button
          class="remove-cart"
          type="button"
        >
          Remover
        </button>

      `;


      item
        .querySelector(
          ".remove-cart"
        )
        .addEventListener(
          "click",
          () => {

            cart.splice(
              index,
              1
            );

            updateCart();

          }
        );


      $("cartItems")
        .appendChild(item);

    }
  );


  $("cartTotal").textContent =
    money(total);
}