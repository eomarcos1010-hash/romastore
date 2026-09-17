/* =========================================================
   ROMA STORE
   SCRIPT.JS
   SUPABASE + FALLBACK LOCALSTORAGE
   ========================================================= */

const SUPABASE_URL = "https://fqkrokgagxklcmvyaqtr.supabase.co";

/*
  A Publishable Key é própria para uso no frontend.
  NÃO coloque aqui uma service_role/secret key.
*/
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mt-o5M3NQDgXLboKB8FuAQ_c3z1l_wZ";

const supabaseClient = window.supabase
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    )
  : null;


/* =========================================================
   CHAVES LOCAIS
   ========================================================= */

const PRODUCTS_KEY = "roma_store_products";
const CATEGORIES_KEY = "roma_store_categories";
const CONFIG_KEY = "roma_store_config";


/* =========================================================
   DADOS PADRÃO
   ========================================================= */

const defaultProducts = [
  {
    id: 1,
    name: "Otimização Avançada",
    category: "otimizacao",
    price: 34.99,
    oldPrice: 45,
    rating: "5.0",
    status: "active",
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
  heroImage: "Identidade Visual Roma Store.png",
  discord: "https://discord.gg/eKUaZD97aD",
  whatsapp: "https://wa.me/5561999069108",
  tiktok: "https://www.tiktok.com/@roma.zx0",
  instagram: "https://www.instagram.com/roma.zx0/"
};


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  return value === null || value === undefined
    ? fallback
    : String(value);
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeProduct(product) {
  if (!product) return null;

  return {
    id: product.id,
    name: safeString(product.name, "Produto"),
    category: safeString(product.category),
    price: normalizeNumber(product.price),
    oldPrice: normalizeNumber(product.oldPrice),
    rating: safeString(product.rating, "5.0"),
    status: safeString(product.status, "active"),
    image: safeString(product.image),
    images: safeArray(product.images),
    purchaseLink: safeString(product.purchaseLink, "#"),
    descriptionTitle: safeString(
      product.descriptionTitle,
      product.name || "PRODUTO"
    ),
    description: safeString(product.description)
  };
}

function normalizeCategory(category) {
  if (!category) return null;

  return {
    id: safeString(category.id),
    name: safeString(category.name),
    image: safeString(category.image)
  };
}

function normalizeConfig(value) {
  return {
    storeName: safeString(
      value?.storeName,
      defaultConfig.storeName
    ),
    storeDescription: safeString(
      value?.storeDescription,
      defaultConfig.storeDescription
    ),
    heroImage: safeString(
      value?.heroImage,
      defaultConfig.heroImage
    ),
    discord: safeString(
      value?.discord,
      defaultConfig.discord
    ),
    whatsapp: safeString(
      value?.whatsapp,
      defaultConfig.whatsapp
    ),
    tiktok: safeString(
      value?.tiktok,
      defaultConfig.tiktok
    ),
    instagram: safeString(
      value?.instagram,
      defaultConfig.instagram
    )
  };
}


/* =========================================================
   LOCALSTORAGE
   ========================================================= */

function loadLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return clone(fallback);
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(
      `Erro ao carregar ${key} do localStorage:`,
      error
    );

    return clone(fallback);
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.warn(
      `Erro ao salvar ${key} no localStorage:`,
      error
    );
  }
}


/* =========================================================
   VARIÁVEIS PRINCIPAIS
   ========================================================= */

let products = loadLocal(
  PRODUCTS_KEY,
  defaultProducts
);

let categories = loadLocal(
  CATEGORIES_KEY,
  defaultCategories
);

let config = loadLocal(
  CONFIG_KEY,
  defaultConfig
);

products = safeArray(products)
  .map(normalizeProduct)
  .filter(Boolean);

categories = safeArray(categories)
  .map(normalizeCategory)
  .filter(Boolean);

config = normalizeConfig(config);


/* =========================================================
   SUPABASE - CONVERSÃO DE DADOS
   ========================================================= */

/*
  O código aceita tanto:

  1. tabelas com colunas normais
  2. tabelas que possuam uma coluna "data" JSON/JSONB

  Isso deixa a leitura mais resistente ao formato usado
  na criação das tabelas.
*/

function extractRowData(row) {
  if (!row) return null;

  if (
    row.data &&
    typeof row.data === "object"
  ) {
    return row.data;
  }

  return row;
}


function mapSupabaseProduct(row) {
  const data = extractRowData(row);

  if (!data) return null;

  return normalizeProduct({
    id: data.id,
    name: data.name,
    category:
      data.category ??
      data.category_id,
    price: data.price,
    oldPrice:
      data.oldPrice ??
      data.old_price,
    rating: data.rating,
    status: data.status,
    image: data.image,
    images: data.images,
    purchaseLink:
      data.purchaseLink ??
      data.purchase_link,
    descriptionTitle:
      data.descriptionTitle ??
      data.description_title,
    description: data.description
  });
}


function mapSupabaseCategory(row) {
  const data = extractRowData(row);

  if (!data) return null;

  return normalizeCategory({
    id: data.id,
    name: data.name,
    image: data.image
  });
}


function mapSupabaseConfig(row) {
  const data = extractRowData(row);

  if (!data) return null;

  return normalizeConfig({
    storeName:
      data.storeName ??
      data.store_name,

    storeDescription:
      data.storeDescription ??
      data.store_description,

    heroImage:
      data.heroImage ??
      data.hero_image,

    discord: data.discord,

    whatsapp: data.whatsapp,

    tiktok: data.tiktok,

    instagram: data.instagram
  });
}


/* =========================================================
   CARREGAMENTO ONLINE
   ========================================================= */

async function loadProductsFromSupabase() {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*");

    if (error) {
      console.warn(
        "Supabase products:",
        error.message
      );

      return false;
    }

    if (!Array.isArray(data)) {
      return false;
    }

    const onlineProducts = data
      .map(mapSupabaseProduct)
      .filter(Boolean);

    if (onlineProducts.length > 0) {
      products = onlineProducts;

      saveLocal(
        PRODUCTS_KEY,
        products
      );
    }

    return true;
  } catch (error) {
    console.warn(
      "Erro ao carregar produtos:",
      error
    );

    return false;
  }
}


async function loadCategoriesFromSupabase() {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { data, error } = await supabaseClient
      .from("categories")
      .select("*");

    if (error) {
      console.warn(
        "Supabase categories:",
        error.message
      );

      return false;
    }

    if (!Array.isArray(data)) {
      return false;
    }

    const onlineCategories = data
      .map(mapSupabaseCategory)
      .filter(Boolean);

    if (onlineCategories.length > 0) {
      categories = onlineCategories;

      saveLocal(
        CATEGORIES_KEY,
        categories
      );
    }

    return true;
  } catch (error) {
    console.warn(
      "Erro ao carregar categorias:",
      error
    );

    return false;
  }
}


async function loadConfigFromSupabase() {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { data, error } = await supabaseClient
      .from("store_config")
      .select("*");

    if (error) {
      console.warn(
        "Supabase store_config:",
        error.message
      );

      return false;
    }

    if (!Array.isArray(data)) {
      return false;
    }

    /*
      Normalmente store_config terá apenas uma linha.
      Se houver várias, usamos a primeira.
    */

    if (data.length > 0) {
      config = mapSupabaseConfig(data[0]);

      config = normalizeConfig(config);

      saveLocal(
        CONFIG_KEY,
        config
      );
    }

    return true;
  } catch (error) {
    console.warn(
      "Erro ao carregar configurações:",
      error
    );

    return false;
  }
}


/* =========================================================
   CARREGAR TODA A LOJA
   ========================================================= */

async function loadStoreFromSupabase() {
  if (!supabaseClient) {
    console.warn(
      "Supabase JS não foi carregado."
    );

    return;
  }

  await Promise.all([
    loadProductsFromSupabase(),
    loadCategoriesFromSupabase(),
    loadConfigFromSupabase()
  ]);

  applyStoreConfig();
  renderCategories();
  updateCategoryState();
  renderProducts();
}


/* =========================================================
   CONFIGURAÇÕES DA LOJA
   ========================================================= */

function applyStoreConfig() {
  config = normalizeConfig(config);

  /*
    Nome da loja
  */

  document
    .querySelectorAll(
      "[data-store-name], .store-name, .brand-name"
    )
    .forEach((element) => {
      element.textContent = config.storeName;
    });


  /*
    Descrição da loja
  */

  document
    .querySelectorAll(
      "[data-store-description], .store-description"
    )
    .forEach((element) => {
      element.textContent =
        config.storeDescription;
    });


  /*
    Hero
  */

  const heroImages = document.querySelectorAll(
    "[data-hero-image], .hero-image, .hero img"
  );

  heroImages.forEach((image) => {
    if (config.heroImage) {
      image.src = config.heroImage;
    }
  });


  /*
    Discord
  */

  document
    .querySelectorAll(
      '[data-support="discord"], .discord-link'
    )
    .forEach((element) => {
      element.href = config.discord || "#";
    });


  /*
    WhatsApp
  */

  document
    .querySelectorAll(
      '[data-support="whatsapp"], .whatsapp-link'
    )
    .forEach((element) => {
      element.href = config.whatsapp || "#";
    });


  /*
    TikTok
  */

  document
    .querySelectorAll(
      '[data-support="tiktok"], .tiktok-link'
    )
    .forEach((element) => {
      element.href = config.tiktok || "#";
    });


  /*
    Instagram
  */

  document
    .querySelectorAll(
      '[data-support="instagram"], .instagram-link'
    )
    .forEach((element) => {
      element.href = config.instagram || "#";
    });


  /*
    Compatibilidade com o caminho antigo
  */

  if (
    config.heroImage ===
    "assets/Identidade Visual Roma Store.png"
  ) {
    config.heroImage =
      "Identidade Visual Roma Store.png";

    saveLocal(
      CONFIG_KEY,
      config
    );
  }
}


/* =========================================================
   CATEGORIAS
   ========================================================= */

let activeCategory = "all";


function renderCategories() {
  const containers = document.querySelectorAll(
    "#categories, .categories, .category-list, .categories-grid"
  );

  if (!containers.length) {
    return;
  }

  containers.forEach((container) => {
    container.innerHTML = "";

    /*
      Botão todos
    */

    const allButton =
      document.createElement("button");

    allButton.className =
      "category-card category-all";

    allButton.dataset.category = "all";

    allButton.innerHTML = `
      <div class="category-image">
        <span>✦</span>
      </div>
      <span>Todos</span>
    `;

    allButton.addEventListener(
      "click",
      () => {
        activeCategory = "all";

        updateCategoryState();
        renderProducts();
      }
    );

    container.appendChild(allButton);


    /*
      Categorias do banco
    */

    categories.forEach((category) => {
      const button =
        document.createElement("button");

      button.className =
        "category-card";

      button.dataset.category =
        category.id;

      button.innerHTML = `
        <div class="category-image">
          ${
            category.image
              ? `<img src="${escapeAttribute(category.image)}" alt="${escapeAttribute(category.name)}">`
              : `<span>◈</span>`
          }
        </div>

        <span>
          ${escapeHTML(category.name)}
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          activeCategory =
            category.id;

          updateCategoryState();
          renderProducts();

          openCategoryPage(category);
        }
      );

      container.appendChild(button);
    });
  });
}


function updateCategoryState() {
  document
    .querySelectorAll(
      "[data-category]"
    )
    .forEach((element) => {
      const category =
        element.dataset.category;

      element.classList.toggle(
        "active",
        category === activeCategory
      );
    });
}


function getVisibleProducts() {
  if (activeCategory === "all") {
    return products.filter(
      (product) =>
        product.status !== "inactive"
    );
  }

  return products.filter(
    (product) =>
      product.category === activeCategory &&
      product.status !== "inactive"
  );
}


/* =========================================================
   PÁGINA DE CATEGORIA
   ========================================================= */

function openCategoryPage(category) {
  const categoryProducts =
    products.filter(
      (product) =>
        product.category === category.id &&
        product.status !== "inactive"
    );

  const page =
    window.open(
      "",
      "_blank"
    );

  if (!page) {
    return;
  }

  page.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>
        ${escapeHTML(category.name)} - Roma Store
      </title>

      <style>
        ${getCategoryPageCSS()}
      </style>

    </head>

    <body>

      <header class="top">
        <button onclick="history.back()">
          ← Voltar
        </button>

        <h1>
          ${escapeHTML(category.name)}
        </h1>
      </header>

      <main class="products">

        ${
          categoryProducts.length
            ? categoryProducts
                .map(createProductCard)
                .join("")
            : `
              <div class="empty">
                Nenhum produto nesta categoria.
              </div>
            `
        }

      </main>

      <script>

        window.opener &&
        window.opener.addEventListener(
          "beforeunload",
          function(){
            window.close();
          }
        );

        window.openProductFromCategory =
          function(id){
            if(
              window.opener &&
              typeof window.opener.openProductFromCategory === "function"
            ){
              window.opener.openProductFromCategory(id);
            }
          };

      <\/script>

    </body>
    </html>
  `);

  page.document.close();
}


function getCategoryPageCSS() {
  return `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #08070f;
      color: #fff;
      font-family: Inter, Arial, sans-serif;
    }

    .top {
      position: sticky;
      top: 0;
      z-index: 5;

      display: flex;
      align-items: center;
      gap: 20px;

      padding: 20px 6%;

      background: rgba(8,7,15,.92);
      backdrop-filter: blur(20px);

      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .top h1 {
      margin: 0;
      font-size: 25px;
    }

    .top button {
      border: 0;
      border-radius: 10px;
      padding: 10px 16px;

      color: white;
      background: #171427;

      cursor: pointer;
    }

    .products {
      display: grid;
      grid-template-columns:
        repeat(auto-fill, minmax(230px, 1fr));

      gap: 20px;

      padding: 35px 6%;
    }

    .product {
      overflow: hidden;

      background: #0f0d1c;

      border: 1px solid
        rgba(255,255,255,.07);

      border-radius: 18px;

      cursor: pointer;

      transition:
        transform .2s,
        border-color .2s;
    }

    .product:hover {
      transform: translateY(-4px);

      border-color:
        rgba(120,90,255,.45);
    }

    .product-image {
      width: 100%;
      height: 220px;

      display: flex;
      align-items: center;
      justify-content: center;

      background: #0a0911;
    }

    .product-image img {
      width: 100%;
      height: 100%;

      object-fit: cover;
    }

    .product-info {
      padding: 16px;
    }

    .product-name {
      font-size: 16px;
      font-weight: 700;
    }

    .product-price {
      margin-top: 10px;

      font-size: 20px;
      font-weight: 800;
    }

    .old-price {
      margin-left: 6px;

      color: #777;

      font-size: 13px;
      text-decoration: line-through;
    }

    .empty {
      grid-column: 1 / -1;

      text-align: center;

      padding: 80px 20px;

      color: #888;
    }
  `;
}


/* =========================================================
   PRODUTOS
   ========================================================= */

function createProductCard(product) {
  const image =
    product.image ||
    "assets/placeholder.png";

  const price =
    normalizeNumber(product.price);

  const oldPrice =
    normalizeNumber(product.oldPrice);

  return `
    <article
      class="product"
      data-product-id="${escapeAttribute(product.id)}"
      onclick="openProduct('${escapeAttribute(product.id)}')"
    >

      <div class="product-image">

        ${
          image
            ? `
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(product.name)}"
                loading="lazy"
              >
            `
            : `
              <span>Sem imagem</span>
            `
        }

      </div>

      <div class="product-info">

        <div class="product-name">
          ${escapeHTML(product.name)}
        </div>

        <div class="product-rating">
          ★ ${escapeHTML(product.rating || "5.0")}
        </div>

        <div class="product-price">

          R$ ${price
            .toFixed(2)
            .replace(".", ",")}

          ${
            oldPrice > price
              ? `
                <span class="old-price">
                  R$ ${oldPrice
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


function renderProducts() {
  const containers =
    document.querySelectorAll(
      "#products, .products-grid, .product-grid, .products"
    );

  if (!containers.length) {
    return;
  }

  const visibleProducts =
    getVisibleProducts();

  containers.forEach((container) => {

    if (!visibleProducts.length) {
      container.innerHTML = `
        <div class="empty-products">
          <h3>Nenhum produto encontrado</h3>
          <p>
            Não há produtos disponíveis nesta categoria.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      visibleProducts
        .map(createProductCard)
        .join("");
  });
}


/* =========================================================
   BUSCA
   ========================================================= */

function setupSearch() {
  const searchInputs =
    document.querySelectorAll(
      'input[type="search"], #search, .search-input'
    );

  searchInputs.forEach((input) => {

    input.addEventListener(
      "input",
      () => {

        const search =
          input.value
            .trim()
            .toLowerCase();

        const containers =
          document.querySelectorAll(
            "#products, .products-grid, .product-grid, .products"
          );

        containers.forEach(
          (container) => {

            const filtered =
              getVisibleProducts()
                .filter(
                  (product) =>
                    product.name
                      .toLowerCase()
                      .includes(search) ||

                    product.description
                      .toLowerCase()
                      .includes(search)
                );

            container.innerHTML =
              filtered.length
                ? filtered
                    .map(createProductCard)
                    .join("")
                : `
                  <div class="empty-products">
                    <h3>
                      Nenhum produto encontrado
                    </h3>

                    <p>
                      Tente pesquisar por outro termo.
                    </p>
                  </div>
                `;
          }
        );
      }
    );
  });
}


/* =========================================================
   DETALHES DO PRODUTO
   ========================================================= */

function openProduct(id) {
  const product =
    products.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!product) {
    return;
  }

  renderProductDetails(product);
}


function openProductFromCategory(id) {
  openProduct(id);
}


window.openProduct =
  openProduct;

window.openProductFromCategory =
  openProductFromCategory;


function renderProductDetails(product) {

  /*
    Primeiro tenta encontrar um modal
    já existente no HTML.
  */

  let modal =
    document.querySelector(
      "#productModal, .product-modal"
    );

  /*
    Caso o projeto não tenha modal,
    criamos um automaticamente.
  */

  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "productModal";

    modal.className =
      "product-modal";

    modal.innerHTML = `
      <div class="product-modal-content">

        <button
          class="product-modal-close"
          aria-label="Fechar"
        >
          ×
        </button>

        <div class="product-modal-body"></div>

      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector(
        ".product-modal-close"
      )
      .addEventListener(
        "click",
        () => {
          modal.remove();
        }
      );
  }

  const body =
    modal.querySelector(
      ".product-modal-body"
    ) || modal;

  const images =
    getProductImages(product);

  body.innerHTML = `

    <div class="product-details">

      <div class="product-gallery">

        <div class="main-product-image">

          <img
            id="productMainImage"
            src="${escapeAttribute(images[0] || product.image)}"
            alt="${escapeAttribute(product.name)}"
          >

        </div>

        ${
          images.length > 1
            ? `
              <div class="product-thumbnails">

                ${images
                  .map(
                    (image, index) => `
                      <button
                        class="product-thumb ${
                          index === 0
                            ? "active"
                            : ""
                        }"
                        data-image="${escapeAttribute(image)}"
                      >
                        <img
                          src="${escapeAttribute(image)}"
                          alt=""
                        >
                      </button>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

      </div>


      <div class="product-details-info">

        <span class="product-category">
          ${escapeHTML(
            getCategoryName(
              product.category
            )
          )}
        </span>

        <h2>
          ${escapeHTML(product.name)}
        </h2>

        <div class="details-rating">
          ★ ${escapeHTML(product.rating || "5.0")}
        </div>

        <div class="details-price">

          R$ ${normalizeNumber(product.price)
            .toFixed(2)
            .replace(".", ",")}

          ${
            normalizeNumber(product.oldPrice) >
            normalizeNumber(product.price)
              ? `
                <span>
                  R$ ${normalizeNumber(
                    product.oldPrice
                  )
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              `
              : ""
          }

        </div>

        ${
          product.descriptionTitle
            ? `
              <h3>
                ${escapeHTML(
                  product.descriptionTitle
                )}
              </h3>
            `
            : ""
        }

        <p class="details-description">
          ${escapeHTML(
            product.description
          )}
        </p>

        <a
          class="purchase-button"
          href="${escapeAttribute(
            product.purchaseLink || "#"
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Comprar agora
        </a>

      </div>

    </div>
  `;

  modal.style.display =
    "flex";

  setupGalleryControls(modal);
}


function getCategoryName(categoryId) {
  const category =
    categories.find(
      (item) =>
        String(item.id) ===
        String(categoryId)
    );

  return category
    ? category.name
    : "Produto";
}


function getProductImages(product) {
  const images = [];

  if (product.image) {
    images.push(product.image);
  }

  if (Array.isArray(product.images)) {
    product.images.forEach(
      (image) => {
        if (
          image &&
          !images.includes(image)
        ) {
          images.push(image);
        }
      }
    );
  }

  return images;
}


function renderGallery(images) {
  return images
    .map(
      (image, index) => `
        <button
          class="gallery-thumb ${
            index === 0
              ? "active"
              : ""
          }"
          data-image="${escapeAttribute(image)}"
        >
          <img
            src="${escapeAttribute(image)}"
            alt=""
          >
        </button>
      `
    )
    .join("");
}


function setupGalleryControls(container) {
  const mainImage =
    container.querySelector(
      "#productMainImage"
    );

  if (!mainImage) {
    return;
  }

  container
    .querySelectorAll(
      ".product-thumb"
    )
    .forEach((thumb) => {

      thumb.addEventListener(
        "click",
        () => {

          const image =
            thumb.dataset.image;

          if (image) {
            mainImage.src =
              image;
          }

          container
            .querySelectorAll(
              ".product-thumb"
            )
            .forEach(
              (item) =>
                item.classList.remove(
                  "active"
                )
            );

          thumb.classList.add(
            "active"
          );
        }
      );
    });
}


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(
      '[data-nav="home"], .nav-home'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            goHome();
          }
        );
      }
    );


  document
    .querySelectorAll(
      '[data-nav="products"], .nav-products'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            const section =
              document.querySelector(
                "#products"
              ) ||
              document.querySelector(
                ".products"
              );

            section?.scrollIntoView({
              behavior: "smooth"
            });
          }
        );
      }
    );
}


function goHome() {
  activeCategory =
    "all";

  updateCategoryState();
  renderProducts();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   SUPORTE
   ========================================================= */

function setupSupport() {

  document
    .querySelectorAll(
      '[data-support="discord"], .discord-link'
    )
    .forEach(
      (element) => {
        element.href =
          config.discord || "#";

        element.target =
          "_blank";

        element.rel =
          "noopener noreferrer";
      }
    );


  document
    .querySelectorAll(
      '[data-support="whatsapp"], .whatsapp-link'
    )
    .forEach(
      (element) => {
        element.href =
          config.whatsapp || "#";

        element.target =
          "_blank";

        element.rel =
          "noopener noreferrer";
      }
    );


  document
    .querySelectorAll(
      '[data-support="tiktok"], .tiktok-link'
    )
    .forEach(
      (element) => {
        element.href =
          config.tiktok || "#";

        element.target =
          "_blank";

        element.rel =
          "noopener noreferrer";
      }
    );


  document
    .querySelectorAll(
      '[data-support="instagram"], .instagram-link'
    )
    .forEach(
      (element) => {
        element.href =
          config.instagram || "#";

        element.target =
          "_blank";

        element.rel =
          "noopener noreferrer";
      }
    );
}


/* =========================================================
   CARRINHO
   ========================================================= */

let cart = [];


function setupCart() {

  try {
    const saved =
      localStorage.getItem(
        "roma_store_cart"
      );

    if (saved) {
      cart =
        JSON.parse(saved);
    }
  } catch {
    cart = [];
  }


  document
    .querySelectorAll(
      ".cart-button, #cartButton, [data-cart]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            openCart();
          }
        );
      }
    );

  updateCart();
}


function saveCart() {
  try {
    localStorage.setItem(
      "roma_store_cart",
      JSON.stringify(cart)
    );
  } catch (error) {
    console.warn(
      "Erro ao salvar carrinho:",
      error
    );
  }
}


function addToCart(productId) {

  const product =
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {
    return;
  }

  const existing =
    cart.find(
      (item) =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {
    existing.quantity =
      (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  updateCart();
}


function removeFromCart(productId) {
  cart =
    cart.filter(
      (item) =>
        String(item.id) !==
        String(productId)
    );

  saveCart();
  updateCart();
}


function openCart() {

  let modal =
    document.querySelector(
      "#cartModal, .cart-modal"
    );

  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "cartModal";

    modal.className =
      "cart-modal";

    modal.innerHTML = `
      <div class="cart-modal-content">

        <button
          class="cart-close"
          aria-label="Fechar carrinho"
        >
          ×
        </button>

        <h2>
          Seu carrinho
        </h2>

        <div class="cart-items"></div>

        <div class="cart-total"></div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelector(
        ".cart-close"
      )
      .addEventListener(
        "click",
        () => {
          closeCart();
        }
      );
  }

  const items =
    modal.querySelector(
      ".cart-items"
    );

  const total =
    modal.querySelector(
      ".cart-total"
    );

  if (!cart.length) {

    items.innerHTML = `
      <div class="cart-empty">
        Seu carrinho está vazio.
      </div>
    `;

    total.innerHTML = "";

  } else {

    items.innerHTML =
      cart
        .map(
          (item) => `
            <div class="cart-item">

              <img
                src="${escapeAttribute(
                  item.image || ""
                )}"
                alt=""
              >

              <div>
                <strong>
                  ${escapeHTML(item.name)}
                </strong>

                <div>
                  ${item.quantity}x
                  R$ ${normalizeNumber(
                    item.price
                  )
                    .toFixed(2)
                    .replace(".", ",")}
                </div>
              </div>

              <button
                onclick="removeFromCart('${escapeAttribute(item.id)}')"
              >
                Remover
              </button>

            </div>
          `
        )
        .join("");

    const cartTotal =
      cart.reduce(
        (sum, item) =>
          sum +
          normalizeNumber(item.price) *
          normalizeNumber(
            item.quantity,
            1
          ),
        0
      );

    total.innerHTML = `
      Total:
      <strong>
        R$ ${cartTotal
          .toFixed(2)
          .replace(".", ",")}
      </strong>
    `;
  }

  modal.style.display =
    "flex";
}


function closeCart() {

  const modal =
    document.querySelector(
      "#cartModal, .cart-modal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}


function updateCart() {

  const count =
    cart.reduce(
      (total, item) =>
        total +
        normalizeNumber(
          item.quantity,
          1
        ),
      0
    );

  document
    .querySelectorAll(
      ".cart-count, #cartCount, [data-cart-count]"
    )
    .forEach(
      (element) => {
        element.textContent =
          count;
      }
    );
}


window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.openCart =
  openCart;

window.closeCart =
  closeCart;


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
  return escapeHTML(value);
}


/* =========================================================
   REALTIME SUPABASE
   ========================================================= */

/*
  Quando o dashboard alterar produtos,
  categorias ou configurações, a loja aberta
  pode atualizar automaticamente.
*/

function setupRealtime() {

  if (!supabaseClient) {
    return;
  }

  try {

    supabaseClient
      .channel(
        "roma-store-products"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products"
        },
        async () => {

          await loadProductsFromSupabase();

          renderProducts();
        }
      )
      .subscribe();


    supabaseClient
      .channel(
        "roma-store-categories"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories"
        },
        async () => {

          await loadCategoriesFromSupabase();

          renderCategories();
          updateCategoryState();
          renderProducts();
        }
      )
      .subscribe();


    supabaseClient
      .channel(
        "roma-store-config"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_config"
        },
        async () => {

          await loadConfigFromSupabase();

          applyStoreConfig();
          setupSupport();
        }
      )
      .subscribe();

  } catch (error) {

    console.warn(
      "Realtime não pôde ser ativado:",
      error
    );
  }
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
      Primeiro mostra os dados locais,
      deixando a página rápida.
    */

    applyStoreConfig();
    renderCategories();
    updateCategoryState();
    setupSupport();
    setupCart();
    setupSearch();
    setupNavigation();
    renderProducts();


    /*
      Depois busca os dados atuais
      do Supabase.
    */

    await loadStoreFromSupabase();


    /*
      Mantém a loja sincronizada
      quando o dashboard alterar algo.
    */

    setupRealtime();

  }
);
