/* =========================================================
   ROMA STORE — DASHBOARD
   Versão corrigida
   ========================================================= */

const SUPABASE_URL = "https://fqkrokgagxklcmvyaqtr.supabase.co";
const SUPABASE_KEY = "sb_publishable_mt-o5M3NQDgXLboKB8FuAQ_c3z1l_wZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =========================================================
   ESTADO
   ========================================================= */

let products = [];
let categories = [];

let config = {
  storeName: "Roma Store",
  storeDescription: "",
  heroImage: "",
  supportWhatsapp: "",
  supportInstagram: "",
  supportTelegram: ""
};

let support = {
  whatsapp: "",
  instagram: "",
  telegram: ""
};

let editingCategoryId = null;
let editingCategoryImage = "";

let editingProductId = null;
let editingProductImage = "";

let initialized = false;

/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Erro ao salvar localStorage:", error);
  }
}

function loadLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("Erro ao carregar localStorage:", error);
    return fallback;
  }
}

function saveLocalData() {
  saveLocal("roma_store_products", products);
  saveLocal("roma_store_categories", categories);
  saveLocal("roma_store_config", config);
  saveLocal("roma_store_support", support);
}

/* =========================================================
   SUPABASE MAPPERS
   ========================================================= */

function productFromSupabase(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name || "",
    category: row.category || "",
    price: Number(row.price || 0),
    oldPrice:
      row.old_price !== null &&
      row.old_price !== undefined
        ? Number(row.old_price)
        : null,

    image: row.image || "",

    images: Array.isArray(row.images)
      ? row.images
      : [],

    description: row.description || "",
    descriptionTitle: row.description_title || "",

    purchaseLink: row.purchase_link || "",

    featured: Boolean(row.featured),
    active:
      row.active === undefined ||
      row.active === null
        ? true
        : Boolean(row.active)
  };
}

function productToSupabase(product) {
  return {
    id: product.id,
    name: product.name || "",
    category: product.category || "",
    price: Number(product.price || 0),

    old_price:
      product.oldPrice === null ||
      product.oldPrice === undefined ||
      product.oldPrice === ""
        ? null
        : Number(product.oldPrice),

    image: product.image || "",

    images: Array.isArray(product.images)
      ? product.images
      : [],

    description: product.description || "",
    description_title: product.descriptionTitle || "",

    purchase_link: product.purchaseLink || "",

    featured: Boolean(product.featured),
    active:
      product.active === undefined
        ? true
        : Boolean(product.active)
  };
}

function categoryFromSupabase(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name || "",
    image: row.image || ""
  };
}

function categoryToSupabase(category) {
  return {
    id: category.id,
    name: category.name || "",
    image: category.image || ""
  };
}

function configFromSupabase(row) {
  if (!row) return null;

  return {
    storeName: row.store_name || "Roma Store",
    storeDescription: row.store_description || "",
    heroImage: row.hero_image || "",

    supportWhatsapp: row.support_whatsapp || "",
    supportInstagram: row.support_instagram || "",
    supportTelegram: row.support_telegram || ""
  };
}

function configToSupabase() {
  return {
    id: 1,

    store_name: config.storeName || "",
    store_description: config.storeDescription || "",
    hero_image: config.heroImage || "",

    support_whatsapp:
      config.supportWhatsapp || support.whatsapp || "",

    support_instagram:
      config.supportInstagram || support.instagram || "",

    support_telegram:
      config.supportTelegram || support.telegram || ""
  };
}

/* =========================================================
   IMAGEM → BASE64
   ========================================================= */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Não foi possível ler a imagem."));
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   CARREGAR DADOS LOCAIS
   ========================================================= */

function loadLocalData() {
  products = loadLocal("roma_store_products", []);
  categories = loadLocal("roma_store_categories", []);

  config = loadLocal(
    "roma_store_config",
    {
      storeName: "Roma Store",
      storeDescription: "",
      heroImage: "",
      supportWhatsapp: "",
      supportInstagram: "",
      supportTelegram: ""
    }
  );

  support = loadLocal(
    "roma_store_support",
    {
      whatsapp: config.supportWhatsapp || "",
      instagram: config.supportInstagram || "",
      telegram: config.supportTelegram || ""
    }
  );
}

/* =========================================================
   CARREGAR SUPABASE
   ========================================================= */

async function loadSupabaseData() {
  try {
    const [
      productsResult,
      categoriesResult,
      configResult
    ] = await Promise.all([
      supabaseClient
        .from("products")
        .select("*"),

      supabaseClient
        .from("categories")
        .select("*"),

      supabaseClient
        .from("store_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
    ]);

    if (productsResult.error) {
      console.error(
        "Erro ao carregar produtos:",
        productsResult.error
      );
    }

    if (categoriesResult.error) {
      console.error(
        "Erro ao carregar categorias:",
        categoriesResult.error
      );
    }

    if (configResult.error) {
      console.error(
        "Erro ao carregar configuração:",
        configResult.error
      );
    }

    if (
      !productsResult.error &&
      Array.isArray(productsResult.data)
    ) {
      products = productsResult.data
        .map(productFromSupabase)
        .filter(Boolean);
    }

    if (
      !categoriesResult.error &&
      Array.isArray(categoriesResult.data)
    ) {
      categories = categoriesResult.data
        .map(categoryFromSupabase)
        .filter(Boolean);
    }

    if (
      !configResult.error &&
      configResult.data
    ) {
      const onlineConfig =
        configFromSupabase(configResult.data);

      if (onlineConfig) {
        config = {
          ...config,
          ...onlineConfig
        };

        support = {
          whatsapp: onlineConfig.supportWhatsapp || "",
          instagram: onlineConfig.supportInstagram || "",
          telegram: onlineConfig.supportTelegram || ""
        };
      }
    }

    saveLocalData();

    return true;

  } catch (error) {
    console.error(
      "Erro geral ao carregar Supabase:",
      error
    );

    return false;
  }
}

/* =========================================================
   SALVAR PRODUTOS ONLINE
   ========================================================= */

async function saveProductsOnline() {
  const rows = products.map(productToSupabase);

  if (rows.length > 0) {
    const { error } = await supabaseClient
      .from("products")
      .upsert(rows, {
        onConflict: "id"
      });

    if (error) {
      console.error(
        "Erro ao salvar produtos:",
        error
      );

      throw error;
    }
  }

  return true;
}

/* =========================================================
   SALVAR CATEGORIAS ONLINE
   ========================================================= */

async function saveCategoriesOnline() {
  const rows = categories.map(categoryToSupabase);

  if (rows.length > 0) {
    const { error } = await supabaseClient
      .from("categories")
      .upsert(rows, {
        onConflict: "id"
      });

    if (error) {
      console.error(
        "Erro ao salvar categorias:",
        error
      );

      throw error;
    }
  }

  return true;
}

/* =========================================================
   SALVAR CONFIG ONLINE
   ========================================================= */

async function saveConfigOnline() {
  const row = configToSupabase();

  const { error } = await supabaseClient
    .from("store_config")
    .upsert(row, {
      onConflict: "id"
    });

  if (error) {
    console.error(
      "Erro ao salvar configuração:",
      error
    );

    throw error;
  }

  return true;
}

/* =========================================================
   SALVAR TUDO
   ========================================================= */

async function saveEverything() {
  saveLocalData();

  try {
    showToast(
      "Salvando alterações...",
      "success"
    );

    await Promise.all([
      saveProductsOnline(),
      saveCategoriesOnline(),
      saveConfigOnline()
    ]);

    saveLocalData();

    showToast(
      "Alterações salvas online!",
      "success"
    );

    renderAll();

    return true;

  } catch (error) {
    console.error(error);

    showToast(
      "Não foi possível salvar online. Verifique o acesso do Supabase.",
      "error"
    );

    return false;
  }
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function setupNavigation() {
  qsa("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;

      if (!section) return;

      openSection(section);
    });
  });

  qsa(".nav-button").forEach(button => {
    if (button.dataset.navigationReady) return;

    button.dataset.navigationReady = "true";

    button.addEventListener("click", () => {
      const section =
        button.dataset.section ||
        button.getAttribute("data-go-section");

      if (section) {
        openSection(section);
      }
    });
  });
}

function openSection(sectionId) {
  qsa(".dashboard-section").forEach(section => {
    section.classList.remove("active");
  });

  const target =
    $(sectionId) ||
    qs(`[data-section-content="${sectionId}"]`);

  if (target) {
    target.classList.add("active");
  }

  qsa(".nav-button").forEach(button => {
    button.classList.remove("active");

    const buttonSection =
      button.dataset.section ||
      button.getAttribute("data-go-section");

    if (buttonSection === sectionId) {
      button.classList.add("active");
    }
  });
}

/* =========================================================
   CATEGORIAS
   ========================================================= */

function openCategoryForm(category = null) {
  editingCategoryId = category
    ? String(category.id)
    : null;

  editingCategoryImage = category
    ? category.image || ""
    : "";

  const form = $("categoryForm");

  if (form) {
    form.reset();
  }

  if ($("categoryName")) {
    $("categoryName").value =
      category ? category.name || "" : "";
  }

  if ($("categorySlug")) {
    $("categorySlug").value =
      category ? String(category.id) : "";
  }

  if ($("categoryImage")) {
    $("categoryImage").value = "";
  }

  updateCategoryImagePreview(
    editingCategoryImage
  );

  const title = $("categoryFormTitle");

  if (title) {
    title.textContent = category
      ? "Editar categoria"
      : "Nova categoria";
  }

  const modal = $("categoryModal");

  if (modal) {
    modal.classList.add("active");
  }
}

function closeCategoryForm() {
  editingCategoryId = null;
  editingCategoryImage = "";

  const modal = $("categoryModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

function updateCategoryImagePreview(image) {
  const preview =
    $("categoryImagePreview");

  if (!preview) return;

  if (image) {
    preview.src = image;
    preview.style.display = "block";
  } else {
    preview.removeAttribute("src");
    preview.style.display = "none";
  }
}

function setupCategoryForm() {
  const form = $("categoryForm");

  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const name =
      $("categoryName")?.value.trim() || "";

    if (!name) {
      showToast(
        "Digite o nome da categoria.",
        "error"
      );

      return;
    }

    let image = editingCategoryImage;

    const imageInput = $("categoryImage");

    if (
      imageInput &&
      imageInput.files &&
      imageInput.files[0]
    ) {
      try {
        image = await fileToBase64(
          imageInput.files[0]
        );
      } catch (error) {
        showToast(
          "Erro ao carregar a imagem.",
          "error"
        );

        return;
      }
    }

    if (editingCategoryId !== null) {
      const index = categories.findIndex(
        category =>
          String(category.id) ===
          String(editingCategoryId)
      );

      if (index !== -1) {
        categories[index] = {
          ...categories[index],
          name,
          image
        };
      }
    } else {
      const id = createCategoryId(name);

      categories.push({
        id,
        name,
        image
      });
    }

    saveLocalData();

    closeCategoryForm();

    renderAll();

    await saveEverything();
  });
}

function createCategoryId(name) {
  const base = slugify(name);

  let id = base || `categoria-${Date.now()}`;

  let counter = 2;

  while (
    categories.some(
      category =>
        String(category.id) === String(id)
    )
  ) {
    id = `${base}-${counter}`;
    counter++;
  }

  return id;
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderCategories() {
  const container =
    $("categoriesList") ||
    $("categoriesGrid");

  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhuma categoria cadastrada.
      </div>
    `;

    return;
  }

  container.innerHTML = categories
    .map(category => {
      const image = category.image
        ? `
          <img
            src="${escapeHtml(category.image)}"
            alt="${escapeHtml(category.name)}"
          >
        `
        : "";

      return `
        <div
          class="category-item"
          data-category-id="${escapeHtml(
            String(category.id)
          )}"
        >

          <div class="category-image">
            ${image}
          </div>

          <div class="category-info">
            <strong>
              ${escapeHtml(category.name)}
            </strong>

            <span>
              ID: ${escapeHtml(
                String(category.id)
              )}
            </span>
          </div>

          <div class="category-actions">

            <button
              type="button"
              class="edit-category"
              data-id="${escapeHtml(
                String(category.id)
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="delete-category"
              data-id="${escapeHtml(
                String(category.id)
              )}"
            >
              Excluir
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  qsa(".edit-category").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      const category = categories.find(
        item =>
          String(item.id) === String(id)
      );

      if (category) {
        openCategoryForm(category);
      }
    });
  });

  qsa(".delete-category").forEach(button => {
    button.addEventListener("click", async () => {
      await removeCategory(
        button.dataset.id
      );
    });
  });
}

async function removeCategory(id) {
  const category = categories.find(
    item => String(item.id) === String(id)
  );

  if (!category) return;

  const confirmed = confirm(
    `Excluir a categoria "${category.name}"?`
  );

  if (!confirmed) return;

  const hasProducts =
    products.some(
      product =>
        String(product.category) ===
        String(id)
    );

  if (hasProducts) {
    showToast(
      "Não é possível excluir uma categoria que possui produtos.",
      "error"
    );

    return;
  }

  categories = categories.filter(
    item =>
      String(item.id) !== String(id)
  );

  saveLocalData();

  renderAll();

  await saveEverything();
}

/* =========================================================
   PRODUTOS
   ========================================================= */

function setupProductForm() {
  const form = $("productForm");

  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const name =
      $("productName")?.value.trim() || "";

    const category =
      $("productCategory")?.value || "";

    const priceValue =
      $("productPrice")?.value || "0";

    const oldPriceValue =
      $("productOldPrice")?.value || "";

    const description =
      $("productDescription")?.value.trim() || "";

    const descriptionTitle =
      $("productDescriptionTitle")
        ?.value.trim() || "";

    const purchaseLink =
      $("productPurchaseLink")
        ?.value.trim() || "";

    const featured =
      $("productFeatured")?.checked || false;

    const active =
      $("productActive")?.checked !== false;

    if (!name) {
      showToast(
        "Digite o nome do produto.",
        "error"
      );

      return;
    }

    const price =
      Number(
        String(priceValue)
          .replace(",", ".")
      ) || 0;

    const oldPrice =
      oldPriceValue === ""
        ? null
        : Number(
            String(oldPriceValue)
              .replace(",", ".")
          ) || 0;

    let image = editingProductImage;

    const imageInput =
      $("productImage");

    if (
      imageInput &&
      imageInput.files &&
      imageInput.files[0]
    ) {
      try {
        image = await fileToBase64(
          imageInput.files[0]
        );
      } catch (error) {
        showToast(
          "Erro ao carregar a imagem.",
          "error"
        );

        return;
      }
    }

    let images = [];

    if (image) {
      images = [image];
    }

    const productData = {
      id:
        editingProductId !== null
          ? editingProductId
          : getNextProductId(),

      name,
      category,
      price,
      oldPrice,
      image,
      images,
      description,
      descriptionTitle,
      purchaseLink,
      featured,
      active
    };

    if (editingProductId !== null) {
      const index = products.findIndex(
        product =>
          String(product.id) ===
          String(editingProductId)
      );

      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...productData
        };
      }
    } else {
      products.push(productData);
    }

    saveLocalData();

    closeProductForm();

    renderAll();

    await saveEverything();
  });
}

function openProductForm(product = null) {
  editingProductId = product
    ? product.id
    : null;

  editingProductImage = product
    ? product.image || ""
    : "";

  const form = $("productForm");

  if (form) {
    form.reset();
  }

  if ($("productName")) {
    $("productName").value =
      product?.name || "";
  }

  if ($("productCategory")) {
    $("productCategory").value =
      product?.category || "";
  }

  if ($("productPrice")) {
    $("productPrice").value =
      product?.price ?? "";
  }

  if ($("productOldPrice")) {
    $("productOldPrice").value =
      product?.oldPrice ?? "";
  }

  if ($("productDescription")) {
    $("productDescription").value =
      product?.description || "";
  }

  if ($("productDescriptionTitle")) {
    $("productDescriptionTitle").value =
      product?.descriptionTitle || "";
  }

  if ($("productPurchaseLink")) {
    $("productPurchaseLink").value =
      product?.purchaseLink || "";
  }

  if ($("productFeatured")) {
    $("productFeatured").checked =
      Boolean(product?.featured);
  }

  if ($("productActive")) {
    $("productActive").checked =
      product?.active !== false;
  }

  if ($("productImage")) {
    $("productImage").value = "";
  }

  updateProductImagePreview(
    editingProductImage
  );

  const title =
    $("productFormTitle");

  if (title) {
    title.textContent = product
      ? "Editar produto"
      : "Novo produto";
  }

  const modal =
    $("productModal");

  if (modal) {
    modal.classList.add("active");
  }
}

function closeProductForm() {
  editingProductId = null;
  editingProductImage = "";

  const modal =
    $("productModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

function updateProductImagePreview(image) {
  const preview =
    $("productImagePreview");

  if (!preview) return;

  if (image) {
    preview.src = image;
    preview.style.display = "block";
  } else {
    preview.removeAttribute("src");
    preview.style.display = "none";
  }
}

function fillCategorySelect() {
  const select =
    $("productCategory");

  if (!select) return;

  const currentValue =
    select.value;

  select.innerHTML = `
    <option value="">
      Selecione uma categoria
    </option>
  `;

  categories.forEach(category => {
    const option =
      document.createElement("option");

    option.value =
      String(category.id);

    option.textContent =
      category.name;

    select.appendChild(option);
  });

  if (
    currentValue &&
    categories.some(
      category =>
        String(category.id) ===
        String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}

function renderProducts() {
  const container =
    $("productsList") ||
    $("productsGrid");

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhum produto cadastrado.
      </div>
    `;

    return;
  }

  container.innerHTML = products
    .map(product => {
      const category =
        categories.find(
          item =>
            String(item.id) ===
            String(product.category)
        );

      const image =
        product.image ||
        (
          Array.isArray(product.images)
            ? product.images[0]
            : ""
        ) ||
        "";

      return `
        <div
          class="product-item"
          data-product-id="${escapeHtml(
            String(product.id)
          )}"
        >

          <div class="product-image">

            ${
              image
                ? `
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(
                      product.name
                    )}"
                  >
                `
                : `
                  <div class="no-image">
                    Sem imagem
                  </div>
                `
            }

          </div>

          <div class="product-info">

            <h3>
              ${escapeHtml(product.name)}
            </h3>

            <span class="product-category">
              ${
                category
                  ? escapeHtml(category.name)
                  : "Sem categoria"
              }
            </span>

            <strong class="product-price">
              ${formatCurrency(product.price)}
            </strong>

            ${
              product.oldPrice
                ? `
                  <del>
                    ${formatCurrency(
                      product.oldPrice
                    )}
                  </del>
                `
                : ""
            }

          </div>

          <div class="product-status">

            <span>
              ${
                product.active
                  ? "Ativo"
                  : "Inativo"
              }
            </span>

            ${
              product.featured
                ? `
                  <span>
                    Destaque
                  </span>
                `
                : ""
            }

          </div>

          <div class="product-actions">

            <button
              type="button"
              class="edit-product"
              data-id="${escapeHtml(
                String(product.id)
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="delete-product"
              data-id="${escapeHtml(
                String(product.id)
              )}"
            >
              Excluir
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  qsa(".edit-product").forEach(button => {
    button.addEventListener("click", () => {
      const product =
        products.find(
          item =>
            String(item.id) ===
            String(button.dataset.id)
        );

      if (product) {
        openProductForm(product);
      }
    });
  });

  qsa(".delete-product").forEach(button => {
    button.addEventListener("click", async () => {
      await removeProduct(
        button.dataset.id
      );
    });
  });
}

async function removeProduct(id) {
  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!product) return;

  const confirmed = confirm(
    `Excluir o produto "${product.name}"?`
  );

  if (!confirmed) return;

  products = products.filter(
    item =>
      String(item.id) !==
      String(id)
  );

  saveLocalData();

  renderAll();

  await saveEverything();
}

function getNextProductId() {
  const numericIds = products
    .map(product => Number(product.id))
    .filter(id => Number.isFinite(id));

  if (numericIds.length === 0) {
    return 1;
  }

  return Math.max(...numericIds) + 1;
}
