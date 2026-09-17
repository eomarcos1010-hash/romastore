const SUPABASE_URL = "https://fqkrokgagxklcmvyaqtr.supabase.co";
const SUPABASE_KEY = "COLOQUE_SUA_PUBLISHABLE_KEY_AQUI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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
    status: "active",
    image: "",
    images: [],
    purchaseLink: "#",
    descriptionTitle: "OTIMIZAÇÃO AVANÇADA",
    description: "Descrição do produto."
  }
];

const defaultCategories = [
  {
    id: "otimizacao",
    name: "Otimização",
    image: ""
  },
  {
    id: "windows",
    name: "Windows",
    image: ""
  },
  {
    id: "personalizacao",
    name: "Personalização",
    image: ""
  },
  {
    id: "ferramentas",
    name: "Ferramentas",
    image: ""
  }
];

const defaultConfig = {
  storeName: "roma store",
  storeDescription: "Sua loja de tecnologia.",
  heroImage: "assets/Identidade Visual Roma Store.png",
  discord: "https://discord.gg/eKUaZD97aD",
  whatsapp: "https://wa.me/5561999069108",
  tiktok: "https://www.tiktok.com/@roma.zx0",
  instagram: "https://www.instagram.com/roma.zx0/"
};

const $ = id => document.getElementById(id);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/* =========================================================
   LOCAL CACHE
========================================================= */

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return clone(fallback);
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error("Erro ao carregar:", key, error);
    return clone(fallback);
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error(
      "Erro ao salvar local:",
      error
    );

    return false;
  }
}

/* =========================================================
   DADOS
========================================================= */

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

if (!Array.isArray(products)) {
  products = clone(defaultProducts);
}

if (!Array.isArray(categories)) {
  categories = clone(defaultCategories);
}

/* =========================================================
   ESTADO
========================================================= */

let dashboardInitialized = false;

/* =========================================================
   UTILIDADES
========================================================= */

function readFileAsDataURL(file) {
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
      reject(
        new Error(
          "Erro ao ler a imagem."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

function normalizeId(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "");
}

function createUniqueCategoryId(
  name,
  ignoreId = null
) {
  const base =
    normalizeId(name) ||
    "categoria";

  let id = base;
  let counter = 2;

  while (
    categories.some(category =>
      String(category.id) ===
        String(id) &&
      String(category.id) !==
        String(ignoreId)
    )
  ) {
    id =
      `${base}-${counter}`;
    counter++;
  }

  return id;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      char =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char])
    );
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* =========================================================
   SUPABASE - CARREGAR
========================================================= */

async function loadSupabaseData() {
  try {
    const [
      productsResponse,
      categoriesResponse,
      configResponse
    ] = await Promise.all([
      supabaseClient
        .from("products")
        .select("*")
        .order("id", {
          ascending: true
        }),

      supabaseClient
        .from("categories")
        .select("*")
        .order("id", {
          ascending: true
        }),

      supabaseClient
        .from("store_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
    ]);

    if (productsResponse.error) {
      throw productsResponse.error;
    }

    if (categoriesResponse.error) {
      throw categoriesResponse.error;
    }

    if (configResponse.error) {
      throw configResponse.error;
    }

    if (
      Array.isArray(
        productsResponse.data
      ) &&
      productsResponse.data.length
    ) {
      products =
        productsResponse.data.map(
          product => ({
            id: product.id,

            name:
              product.name || "",

            category:
              product.category || "",

            price:
              Number(product.price) || 0,

            oldPrice:
              product.old_price === null ||
              product.old_price === undefined
                ? 0
                : Number(
                    product.old_price
                  ),

            rating:
              product.rating === null ||
              product.rating === undefined
                ? "5.0"
                : String(
                    product.rating
                  ),

            status:
              product.status ||
              "active",

            image:
              product.image || "",

            images:
              Array.isArray(
                product.images
              )
                ? product.images
                : [],

            purchaseLink:
              product.purchase_link ||
              "#",

            descriptionTitle:
              product.description_title ||
              "",

            description:
              product.description ||
              ""
          })
        );

      saveLocal(
        PRODUCTS_KEY,
        products
      );
    }

    if (
      Array.isArray(
        categoriesResponse.data
      ) &&
      categoriesResponse.data.length
    ) {
      categories =
        categoriesResponse.data.map(
          category => ({
            id: category.id,

            name:
              category.name || "",

            image:
              category.image || ""
          })
        );

      saveLocal(
        CATEGORIES_KEY,
        categories
      );
    }

    if (configResponse.data) {
      const data =
        configResponse.data;

      config = {
        storeName:
          data.store_name ||
          defaultConfig.storeName,

        storeDescription:
          data.store_description ||
          defaultConfig.storeDescription,

        heroImage:
          data.hero_image ||
          defaultConfig.heroImage,

        discord:
          data.discord ||
          defaultConfig.discord,

        whatsapp:
          data.whatsapp ||
          defaultConfig.whatsapp,

        tiktok:
          data.tiktok ||
          defaultConfig.tiktok,

        instagram:
          data.instagram ||
          defaultConfig.instagram
      };

      saveLocal(
        CONFIG_KEY,
        config
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Erro ao carregar dados do Supabase:",
      error
    );

    return false;
  }
}

/* =========================================================
   SUPABASE - PRODUTOS
========================================================= */

async function saveProductsOnline() {
  const rows =
    products.map(product => ({
      id: product.id,

      name:
        product.name || "",

      category:
        product.category || "",

      price:
        Number(product.price) || 0,

      old_price:
        product.oldPrice === "" ||
        product.oldPrice === null ||
        product.oldPrice === undefined
          ? null
          : Number(
              product.oldPrice
            ),

      rating:
        product.rating === "" ||
        product.rating === null ||
        product.rating === undefined
          ? "5.0"
          : String(
              product.rating
            ),

      status:
        product.status ||
        "active",

      image:
        product.image || "",

      images:
        Array.isArray(product.images)
          ? product.images
          : [],

      purchase_link:
        product.purchaseLink ||
        "#",

      description_title:
        product.descriptionTitle ||
        "",

      description:
        product.description ||
        ""
    }));

  const {
    data: existing,
    error: existingError
  } = await supabaseClient
    .from("products")
    .select("id");

  if (existingError) {
    throw existingError;
  }

  if (rows.length) {
    const {
      error
    } = await supabaseClient
      .from("products")
      .upsert(
        rows,
        {
          onConflict: "id"
        }
      );

    if (error) {
      throw error;
    }
  }

  const currentIds =
    rows.map(
      row => String(row.id)
    );

  const removeIds =
    (existing || [])
      .map(
        row => String(row.id)
      )
      .filter(
        id =>
          !currentIds.includes(id)
      );

  if (removeIds.length) {
    const {
      error
    } = await supabaseClient
      .from("products")
      .delete()
      .in(
        "id",
        removeIds
      );

    if (error) {
      throw error;
    }
  }
}

/* =========================================================
   SUPABASE - CATEGORIAS
========================================================= */

async function saveCategoriesOnline() {
  const rows =
    categories.map(category => ({
      id: category.id,

      name:
        category.name || "",

      image:
        category.image || ""
    }));

  const {
    data: existing,
    error: existingError
  } = await supabaseClient
    .from("categories")
    .select("id");

  if (existingError) {
    throw existingError;
  }

  if (rows.length) {
    const {
      error
    } = await supabaseClient
      .from("categories")
      .upsert(
        rows,
        {
          onConflict: "id"
        }
      );

    if (error) {
      throw error;
    }
  }

  const currentIds =
    rows.map(
      row => String(row.id)
    );

  const removeIds =
    (existing || [])
      .map(
        row => String(row.id)
      )
      .filter(
        id =>
          !currentIds.includes(id)
      );

  if (removeIds.length) {
    const {
      error
    } = await supabaseClient
      .from("categories")
      .delete()
      .in(
        "id",
        removeIds
      );

    if (error) {
      throw error;
    }
  }
}

/* =========================================================
   SUPABASE - CONFIG
========================================================= */

async function saveConfigOnline() {
  const row = {
    id: 1,

    store_name:
      config.storeName || "",

    store_description:
      config.storeDescription ||
      "",

    hero_image:
      config.heroImage || "",

    discord:
      config.discord || "",

    whatsapp:
      config.whatsapp || "",

    tiktok:
      config.tiktok || "",

    instagram:
      config.instagram || ""
  };

  const {
    error
  } = await supabaseClient
    .from("store_config")
    .upsert(
      row,
      {
        onConflict: "id"
      }
    );

  if (error) {
    throw error;
  }
}

/* =========================================================
   SALVAR ONLINE
========================================================= */

async function saveEverything() {
  try {
    /*
     * CACHE LOCAL
     */

    saveLocal(
      PRODUCTS_KEY,
      products
    );

    saveLocal(
      CATEGORIES_KEY,
      categories
    );

    saveLocal(
      CONFIG_KEY,
      config
    );

    /*
     * BANCO ONLINE
     */

    await Promise.all([
      saveProductsOnline(),
      saveCategoriesOnline(),
      saveConfigOnline()
    ]);

    return true;
  } catch (error) {
    console.error(
      "Erro ao salvar online:",
      error
    );

    if (
      error &&
      (
        error.code ===
          "42501" ||
        error.status === 401 ||
        error.status === 403
      )
    ) {
      showToast(
        "O Supabase bloqueou a gravação. Verifique o login e as políticas RLS."
      );
    } else {
      showToast(
        "Erro ao salvar online. Veja o console."
      );
    }

    return false;
  }
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    /*
     * EVITA INICIALIZAR DUAS VEZES
     */

    if (dashboardInitialized) {
      return;
    }

    dashboardInitialized = true;

    setupNavigation();
    setupOverview();
    setupStoreForm();
    setupCategoryForm();
    setupProductForm();
    setupSupportForm();

    renderAll();

    /*
     * BUSCA ONLINE DEPOIS
     */

    const online =
      await loadSupabaseData();

    if (online) {
      renderAll();
    }
  }
);

/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          showSection(
            button.dataset.section
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-go-section]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          showSection(
            button.dataset.goSection
          );
        }
      );
    });
}

function showSection(section) {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.section ===
          section
      );
    });

  document
    .querySelectorAll(
      ".dashboard-section"
    )
    .forEach(item => {
      item.classList.toggle(
        "active",
        item.id ===
          `section-${section}`
      );
    });

  const titles = {
    overview:
      "Visão geral",

    store:
      "Loja",

    categories:
      "Categorias",

    products:
      "Produtos",

    support:
      "Suporte"
  };

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      titles[section] ||
      "Dashboard";
  }
}

/* =========================================================
   OVERVIEW
========================================================= */

function setupOverview() {
  const button =
    $("saveAllButton");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;

      const oldText =
        button.textContent;

      button.textContent =
        "Salvando...";

      const success =
        await saveEverything();

      button.disabled = false;

      button.textContent =
        oldText;

      if (success) {
        showToast(
          "Todas as alterações foram salvas online."
        );
      }
    }
  );
}

function updateOverview() {
  if (
    $("overviewCategories")
  ) {
    $("overviewCategories")
      .textContent =
      categories.length;
  }

  if (
    $("overviewProducts")
  ) {
    $("overviewProducts")
      .textContent =
      products.length;
  }

  if (
    $("overviewActiveProducts")
  ) {
    $("overviewActiveProducts")
      .textContent =
      products.filter(
        product =>
          product.status !==
          "inactive"
      ).length;
  }
}

/* =========================================================
   LOJA
========================================================= */

function setupStoreForm() {
  const hero =
    $("heroImage");

  const form =
    $("storeForm");

  if (hero) {
    hero.addEventListener(
      "change",
      async event => {
        const file =
          event.target.files?.[0];

        if (!file) return;

        try {
          const image =
            await readFileAsDataURL(
              file
            );

          if ($("heroPreview")) {
            $("heroPreview").src =
              image;

            $("heroPreview")
              .style.display =
              "block";
          }
        } catch {
          showToast(
            "Não foi possível carregar o banner."
          );
        }
      }
    );
  }

  if (form) {
    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const file =
          $("heroImage")
            ?.files?.[0];

        if (file) {
          config.heroImage =
            await readFileAsDataURL(
              file
            );
        }

        config.storeName =
          $("storeName")
            ?.value
            .trim() || "";

        config.storeDescription =
          $("storeDescription")
            ?.value
            .trim() || "";

        const success =
          await saveEverything();

        if (success) {
          showToast(
            "Dados da loja salvos online."
          );
        }
      }
    );
  }
}

function loadStoreForm() {
  if (!$("storeName")) {
    return;
  }

  $("storeName").value =
    config.storeName || "";

  $("storeDescription").value =
    config.storeDescription ||
    "";

  if ($("heroPreview")) {
    $("heroPreview").src =
      config.heroImage || "";

    $("heroPreview")
      .style.display =
      config.heroImage
        ? "block"
        : "none";
  }
}

/* =========================================================
   CATEGORIAS
========================================================= */

function setupCategoryForm() {
  const newButton =
    $("newCategoryButton");

  const cancelButton =
    $("cancelCategoryButton");

  const cancelBottom =
    $("cancelCategoryButtonBottom");

  const image =
    $("categoryImage");

  const form =
    $("categoryForm");

  if (newButton) {
    newButton.addEventListener(
      "click",
      () => {
        openCategoryForm();
      }
    );
  }

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      closeCategoryForm
    );
  }

  if (cancelBottom) {
    cancelBottom.addEventListener(
      "click",
      closeCategoryForm
    );
  }

  if (image) {
    image.addEventListener(
      "change",
      async event => {
        const file =
          event.target.files?.[0];

        if (!file) return;

        try {
          const imageData =
            await readFileAsDataURL(
              file
            );

          if ($("categoryPreview")) {
            $("categoryPreview").src =
              imageData;

            $("categoryPreview")
              .style.display =
              "block";
          }
        } catch {
          showToast(
            "Não foi possível carregar a imagem."
          );
        }
      }
    );
  }

  if (form) {
    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        try {
          const name =
            $("categoryName")
              ?.value
              .trim() || "";

          const manualId =
            $("categorySlug")
              ?.value
              .trim() || "";

          const oldId =
            $("categoryId")
              ?.value
              .trim() || "";

          const file =
            $("categoryImage")
              ?.files?.[0];

          if (!name) {
            showToast(
              "Digite o nome da categoria."
            );

            $("categoryName")?.focus();

            return;
          }

          let id =
            normalizeId(
              manualId
            );

          if (!id) {
            id =
              oldId ||
              createUniqueCategoryId(
                name,
                oldId
              );
          }

          const duplicate =
            categories.some(
              category =>
                String(
                  category.id
                ) ===
                  String(id) &&
                String(
                  category.id
                ) !==
                  String(oldId)
            );

          if (duplicate) {
            id =
              createUniqueCategoryId(
                name,
                oldId
              );
          }

          let imageData = "";

          const oldCategory =
            categories.find(
              category =>
                String(
                  category.id
                ) ===
                String(oldId)
            );

          if (file) {
            imageData =
              await readFileAsDataURL(
                file
              );
          } else {
            imageData =
              oldCategory?.image ||
              "";
          }

          const category = {
            id,
            name,
            image:
              imageData
          };

          if (oldId) {
            const index =
              categories.findIndex(
                item =>
                  String(
                    item.id
                  ) ===
                  String(oldId)
              );

            if (index !== -1) {
              categories[index] =
                category;
            }

            if (
              String(oldId) !==
              String(id)
            ) {
              products =
                products.map(
                  product => {
                    if (
                      String(
                        product.category
                      ) ===
                      String(oldId)
                    ) {
                      return {
                        ...product,
                        category:
                          id
                      };
                    }

                    return product;
                  }
                );
            }
          } else {
            categories.push(
              category
            );
          }

          const success =
            await saveEverything();

          if (!success) {
            return;
          }

          renderAll();
          closeCategoryForm();

          showToast(
            oldId
              ? "Categoria atualizada com sucesso."
              : "Categoria criada com sucesso."
          );
        } catch (error) {
          console.error(
            "Erro categoria:",
            error
          );

          showToast(
            "Erro ao salvar a categoria."
          );
        }
      }
    );
  }
}function openCategoryForm(category = null) {
  const formCard = $("categoryFormCard");
  const formTitle = $("categoryFormTitle");

  if (!formCard) return;

  if (category) {
    if ($("categoryId")) $("categoryId").value = category.id ?? "";
    if ($("categoryName")) $("categoryName").value = category.name ?? "";
    if ($("categorySlug")) $("categorySlug").value = category.slug ?? "";
    if ($("categoryImage")) $("categoryImage").value = category.image ?? "";

    if (formTitle) formTitle.textContent = "Editar categoria";

    if ($("categoryPreview")) {
      $("categoryPreview").src = category.image || "";
      $("categoryPreview").style.display = category.image ? "block" : "none";
    }
  } else {
    if ($("categoryId")) $("categoryId").value = "";
    if ($("categoryName")) $("categoryName").value = "";
    if ($("categorySlug")) $("categorySlug").value = "";
    if ($("categoryImage")) $("categoryImage").value = "";

    if (formTitle) formTitle.textContent = "Nova categoria";

    if ($("categoryPreview")) {
      $("categoryPreview").src = "";
      $("categoryPreview").style.display = "none";
    }
  }

  formCard.style.display = "block";
  formCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function closeCategoryForm() {
  const formCard = $("categoryFormCard");

  if (formCard) {
    formCard.style.display = "none";
  }

  if ($("categoryForm")) {
    $("categoryForm").reset();
  }

  if ($("categoryId")) {
    $("categoryId").value = "";
  }

  if ($("categoryPreview")) {
    $("categoryPreview").src = "";
    $("categoryPreview").style.display = "none";
  }
}


function renderCategories() {
  const container = $("categoriesEditor");

  if (!container) return;

  container.innerHTML = "";

  if (!categories.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhuma categoria cadastrada.</p>
      </div>
    `;
    return;
  }

  categories.forEach(category => {
    const item = document.createElement("div");
    item.className = "editor-item";

    item.innerHTML = `
      <div class="editor-item-main">

        <div class="editor-item-image">
          ${
            category.image
              ? `<img src="${category.image}" alt="${escapeHtml(category.name || "Categoria")}">`
              : `<div class="placeholder-image">📁</div>`
          }
        </div>

        <div class="editor-item-info">
          <strong>${escapeHtml(category.name || "Sem nome")}</strong>
          <span>${escapeHtml(category.slug || "")}</span>
        </div>

      </div>

      <div class="editor-item-actions">

        <button
          type="button"
          class="edit-button"
          data-edit-category="${escapeHtml(String(category.id))}"
        >
          Editar
        </button>

        <button
          type="button"
          class="delete-button"
          data-delete-category="${escapeHtml(String(category.id))}"
        >
          Excluir
        </button>

      </div>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll("[data-edit-category]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.editCategory;

      const category = categories.find(
        item => String(item.id) === String(id)
      );

      if (category) {
        openCategoryForm(category);
      }
    });
  });

  container.querySelectorAll("[data-delete-category]").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteCategory;

      await removeCategory(id);
    });
  });
}


async function removeCategory(id) {
  const category = categories.find(
    item => String(item.id) === String(id)
  );

  if (!category) return;

  const confirmed = confirm(
    `Deseja realmente excluir a categoria "${category.name}"?`
  );

  if (!confirmed) return;

  const hasProducts = products.some(
    product =>
      String(product.category || "") === String(category.id)
  );

  if (hasProducts) {
    showToast(
      "Não é possível excluir uma categoria que possui produtos.",
      "error"
    );
    return;
  }

  categories = categories.filter(
    item => String(item.id) !== String(id)
  );

  saveLocalData();
  renderAll();

  const result = await saveCategoriesOnline();

  if (result) {
    showToast("Categoria excluída com sucesso.", "success");
  }
}


/* =========================================================
   PRODUTOS
========================================================= */

function setupProductForm() {
  const form = $("productForm");

  if (!form || form.dataset.initialized === "true") {
    return;
  }

  form.dataset.initialized = "true";

  const imageInput = $("productImage");

  if (imageInput) {
    imageInput.addEventListener("input", () => {
      updateImagePreview(
        imageInput,
        $("productPreview")
      );
    });

    imageInput.addEventListener("change", () => {
      updateImagePreview(
        imageInput,
        $("productPreview")
      );
    });
  }

  const imagesInput = $("productImages");

  if (imagesInput) {
    imagesInput.addEventListener("input", () => {
      const firstImage = imagesInput.value
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean)[0];

      if ($("productPreview")) {
        $("productPreview").src = firstImage || "";
        $("productPreview").style.display =
          firstImage ? "block" : "none";
      }
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = $("productId")?.value.trim();

    const name = $("productName")?.value.trim() || "";
    const category = $("productCategory")?.value.trim() || "";
    const price = parseFloat(
      $("productPrice")?.value || "0"
    );
    const oldPrice = parseFloat(
      $("productOldPrice")?.value || "0"
    );
    const rating = parseFloat(
      $("productRating")?.value || "0"
    );

    const status =
      $("productStatus")?.value || "active";

    const purchaseLink =
      $("productPurchaseLink")?.value.trim() || "";

    const descriptionTitle =
      $("productDescriptionTitle")?.value.trim() || "";

    const description =
      $("productDescription")?.value.trim() || "";

    const image =
      $("productImage")?.value.trim() || "";

    const imagesText =
      $("productImages")?.value || "";

    const images = imagesText
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean);

    if (!name) {
      showToast("Digite o nome do produto.", "error");
      return;
    }

    if (!category) {
      showToast("Selecione uma categoria.", "error");
      return;
    }

    if (!price || price <= 0) {
      showToast("Digite um preço válido.", "error");
      return;
    }

    const productData = {
      id: id || getNextProductId(),
      name,
      category,
      price,
      old_price: oldPrice > 0 ? oldPrice : null,
      rating: rating > 0 ? rating : 0,
      status,
      image,
      images,
      purchase_link: purchaseLink,
      description_title: descriptionTitle,
      description
    };

    const existingIndex = products.findIndex(
      product =>
        String(product.id) === String(productData.id)
    );

    if (existingIndex >= 0) {
      products[existingIndex] = productData;
    } else {
      products.push(productData);
    }

    saveLocalData();

    renderAll();
    closeProductForm();

    const result = await saveProductsOnline();

    if (result) {
      showToast(
        existingIndex >= 0
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso.",
        "success"
      );
    }
  });
}


function openProductForm(product = null) {
  const formCard = $("productFormCard");
  const formTitle = $("productFormTitle");

  if (!formCard) return;

  fillCategorySelect();

  if (product) {
    if ($("productId")) {
      $("productId").value = product.id ?? "";
    }

    if ($("productName")) {
      $("productName").value = product.name ?? "";
    }

    if ($("productCategory")) {
      $("productCategory").value = product.category ?? "";
    }

    if ($("productPrice")) {
      $("productPrice").value = product.price ?? "";
    }

    if ($("productOldPrice")) {
      $("productOldPrice").value =
        product.old_price ?? "";
    }

    if ($("productRating")) {
      $("productRating").value =
        product.rating ?? "";
    }

    if ($("productStatus")) {
      $("productStatus").value =
        product.status || "active";
    }

    if ($("productPurchaseLink")) {
      $("productPurchaseLink").value =
        product.purchase_link ?? "";
    }

    if ($("productDescriptionTitle")) {
      $("productDescriptionTitle").value =
        product.description_title ?? "";
    }

    if ($("productDescription")) {
      $("productDescription").value =
        product.description ?? "";
    }

    if ($("productImage")) {
      $("productImage").value =
        product.image ?? "";
    }

    if ($("productImages")) {
      $("productImages").value =
        Array.isArray(product.images)
          ? product.images.join("\n")
          : "";
    }

    if ($("productPreview")) {
      const preview =
        product.image ||
        (
          Array.isArray(product.images)
            ? product.images[0]
            : ""
        ) ||
        "";

      $("productPreview").src = preview;

      $("productPreview").style.display =
        preview ? "block" : "none";
    }

    if (formTitle) {
      formTitle.textContent = "Editar produto";
    }
  } else {
    if ($("productForm")) {
      $("productForm").reset();
    }

    if ($("productId")) {
      $("productId").value = "";
    }

    if ($("productStatus")) {
      $("productStatus").value = "active";
    }

    if ($("productPreview")) {
      $("productPreview").src = "";
      $("productPreview").style.display = "none";
    }

    if (formTitle) {
      formTitle.textContent = "Novo produto";
    }
  }

  formCard.style.display = "block";

  formCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function closeProductForm() {
  const formCard = $("productFormCard");

  if (formCard) {
    formCard.style.display = "none";
  }

  if ($("productForm")) {
    $("productForm").reset();
  }

  if ($("productId")) {
    $("productId").value = "";
  }

  if ($("productStatus")) {
    $("productStatus").value = "active";
  }

  if ($("productPreview")) {
    $("productPreview").src = "";
    $("productPreview").style.display = "none";
  }
}


function fillCategorySelect() {
  const select = $("productCategory");

  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Selecione uma categoria</option>
  `;

  categories.forEach(category => {
    const option = document.createElement("option");

    option.value = category.id;
    option.textContent = category.name;

    select.appendChild(option);
  });

  if (
    currentValue &&
    categories.some(
      category =>
        String(category.id) === String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}


function renderProducts() {
  const container = $("productsEditor");

  if (!container) return;

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum produto cadastrado.</p>
      </div>
    `;

    return;
  }

  products.forEach(product => {
    const item = document.createElement("div");

    item.className = "editor-item";

    const category = categories.find(
      cat =>
        String(cat.id) === String(product.category)
    );

    const categoryName =
      category?.name ||
      product.category ||
      "Sem categoria";

    const image =
      product.image ||
      (
        Array.isArray(product.images)
          ? product.images[0]
          : ""
      ) ||
      "";

    const priceNumber =
      Number(product.price) || 0;

    item.innerHTML = `
      <div class="editor-item-main">

        <div class="editor-item-image">
          ${
            image
              ? `<img src="${image}" alt="${escapeHtml(product.name || "Produto")}">`
              : `<div class="placeholder-image">🛒</div>`
          }
        </div>

        <div class="editor-item-info">

          <strong>
            ${escapeHtml(product.name || "Sem nome")}
          </strong>

          <span>
            ${escapeHtml(categoryName)}
          </span>

          <span>
            R$ ${priceNumber.toFixed(2).replace(".", ",")}
          </span>

          <span>
            ${
              product.status === "active"
                ? "Ativo"
                : "Inativo"
            }
          </span>

        </div>

      </div>

      <div class="editor-item-actions">

        <button
          type="button"
          class="edit-button"
          data-edit-product="${escapeHtml(String(product.id))}"
        >
          Editar
        </button>

        <button
          type="button"
          class="delete-button"
          data-delete-product="${escapeHtml(String(product.id))}"
        >
          Excluir
        </button>

      </div>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.editProduct;

      const product = products.find(
        item =>
          String(item.id) === String(id)
      );

      if (product) {
        openProductForm(product);
      }
    });
  });

  container.querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteProduct;

      await removeProduct(id);
    });
  });
}


async function removeProduct(id) {
  const product = products.find(
    item =>
      String(item.id) === String(id)
  );

  if (!product) return;

  const confirmed = confirm(
    `Deseja realmente excluir o produto "${product.name}"?`
  );

  if (!confirmed) return;

  products = products.filter(
    item =>
      String(item.id) !== String(id)
  );

  saveLocalData();
  renderAll();

  const result = await saveProductsOnline();

  if (result) {
    showToast(
      "Produto excluído com sucesso.",
      "success"
    );
  }
}


function getNextProductId() {
  const numericIds = products
    .map(product => Number(product.id))
    .filter(id => Number.isFinite(id));

  if (!numericIds.length) {
    return 1;
  }

  return Math.max(...numericIds) + 1;
}


/* =========================================================
   SUPORTE
========================================================= */

function setupSupportForm() {
  const form = $("supportForm");

  if (!form || form.dataset.initialized === "true") {
    return;
  }

  form.dataset.initialized = "true";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    config.discord =
      $("discord")?.value.trim() || "";

    config.whatsapp =
      $("whatsapp")?.value.trim() || "";

    config.tiktok =
      $("tiktok")?.value.trim() || "";

    config.instagram =
      $("instagram")?.value.trim() || "";

    saveLocalData();

    const result = await saveConfigOnline();

    if (result) {
      showToast(
        "Links de suporte salvos com sucesso.",
        "success"
      );
    }
  });
}


function loadSupportForm() {
  if ($("discord")) {
    $("discord").value =
      config.discord || "";
  }

  if ($("whatsapp")) {
    $("whatsapp").value =
      config.whatsapp || "";
  }

  if ($("tiktok")) {
    $("tiktok").value =
      config.tiktok || "";
  }

  if ($("instagram")) {
    $("instagram").value =
      config.instagram || "";
  }
}


/* =========================================================
   RENDER GERAL
========================================================= */

function renderAll() {
  renderOverview();

  renderStoreForm();

  renderCategories();

  fillCategorySelect();

  renderProducts();

  loadSupportForm();
}


function renderOverview() {
  if ($("overviewCategories")) {
    $("overviewCategories").textContent =
      categories.length;
  }

  if ($("overviewProducts")) {
    $("overviewProducts").textContent =
      products.length;
  }

  if ($("overviewActiveProducts")) {
    $("overviewActiveProducts").textContent =
      products.filter(
        product =>
          product.status === "active"
      ).length;
  }
}


function renderStoreForm() {
  if ($("storeName")) {
    $("storeName").value =
      config.store_name || "";
  }

  if ($("storeDescription")) {
    $("storeDescription").value =
      config.store_description || "";
  }

  if ($("heroImage")) {
    $("heroImage").value =
      config.hero_image || "";
  }

  if ($("heroPreview")) {
    if (config.hero_image) {
      $("heroPreview").src =
        config.hero_image;

      $("heroPreview").style.display =
        "block";
    } else {
      $("heroPreview").src = "";
      $("heroPreview").style.display =
        "none";
    }
  }
}


/* =========================================================
   PREVIEW DE IMAGENS
========================================================= */

function updateImagePreview(input, preview) {
  if (!input || !preview) return;

  const value =
    input.value.trim();

  if (!value) {
    preview.src = "";
    preview.style.display = "none";
    return;
  }

  preview.src = value;
  preview.style.display = "block";

  preview.onerror = () => {
    preview.style.display = "none";
  };
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {
  const toast = $("toast");

  if (!toast) {
    console.log(`[${type}] ${message}`);
    return;
  }

  toast.textContent = message;

  toast.className =
    `toast ${type}`;

  toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


/* =========================================================
   FINALIZAÇÃO
========================================================= */

window.RomaStoreDashboard = {
  products,
  categories,
  config,

  renderAll,
  openProductForm,
  closeProductForm,
  openCategoryForm,
  closeCategoryForm,
  saveEverything
};
