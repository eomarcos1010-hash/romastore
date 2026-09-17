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
   STORAGE
========================================================= */

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return clone(fallback);
    }

    const parsed = JSON.parse(saved);

    return parsed;
  } catch (error) {
    console.error("Erro ao carregar:", key, error);
    return clone(fallback);
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Erro ao salvar:", key, error);

    showToast(
      "Não foi possível salvar. O armazenamento do navegador pode estar cheio."
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

/*
 * GARANTE QUE CATEGORIES SEMPRE SEJA UM ARRAY
 */

if (!Array.isArray(categories)) {
  categories = clone(defaultCategories);
}

if (!Array.isArray(products)) {
  products = clone(defaultProducts);
}

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
      reject(new Error("Erro ao ler a imagem."));
    };

    reader.readAsDataURL(file);
  });
}

function normalizeId(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * NOVA GERAÇÃO DE ID
 *
 * Não depende de quantidade de categorias.
 * Não depende do ID anterior.
 * Não depende de produto.
 */

function createUniqueCategoryId(name) {
  const base =
    normalizeId(name) || "categoria";

  let id = base;

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

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupOverview();
  setupStoreForm();
  setupCategoryForm();
  setupProductForm();
  setupSupportForm();

  renderAll();
});

/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        showSection(button.dataset.section);
      });
    });

  document
    .querySelectorAll("[data-go-section]")
    .forEach(button => {
      button.addEventListener("click", () => {
        showSection(button.dataset.goSection);
      });
    });
}

function showSection(section) {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.section === section
      );
    });

  document
    .querySelectorAll(".dashboard-section")
    .forEach(item => {
      item.classList.toggle(
        "active",
        item.id === `section-${section}`
      );
    });

  const titles = {
    overview: "Visão geral",
    store: "Loja",
    categories: "Categorias",
    products: "Produtos",
    support: "Suporte"
  };

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      titles[section] || "Dashboard";
  }
}

/* =========================================================
   VISÃO GERAL
========================================================= */

function setupOverview() {
  const button = $("saveAllButton");

  if (!button) return;

  button.addEventListener("click", () => {
    const success = saveEverything();

    if (success) {
      showToast(
        "Todas as alterações foram salvas."
      );
    }
  });
}

function updateOverview() {
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
          product.status !== "inactive"
      ).length;
  }
}

/* =========================================================
   LOJA
========================================================= */

function setupStoreForm() {
  if (!$("heroImage")) return;

  $("heroImage").addEventListener(
    "change",
    async event => {
      const file =
        event.target.files[0];

      if (!file) return;

      try {
        const image =
          await readFileAsDataURL(file);

        $("heroPreview").src = image;
        $("heroPreview").style.display =
          "block";
      } catch {
        showToast(
          "Não foi possível carregar o banner."
        );
      }
    }
  );

  $("storeForm").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const file =
        $("heroImage").files[0];

      if (file) {
        config.heroImage =
          await readFileAsDataURL(file);
      }

      config.storeName =
        $("storeName").value.trim();

      config.storeDescription =
        $("storeDescription").value.trim();

      if (
        save(
          CONFIG_KEY,
          config
        )
      ) {
        showToast(
          "Dados da loja salvos."
        );
      }
    }
  );
}

function loadStoreForm() {
  if (!$("storeName")) return;

  $("storeName").value =
    config.storeName || "";

  $("storeDescription").value =
    config.storeDescription || "";

  $("heroPreview").src =
    config.heroImage || "";

  $("heroPreview").style.display =
    config.heroImage
      ? "block"
      : "none";
}

/* =========================================================
   CATEGORIAS
========================================================= */

function setupCategoryForm() {
  /*
   * NOVA CATEGORIA
   */

  $("newCategoryButton").addEventListener(
    "click",
    () => {
      openCategoryForm();
    }
  );

  /*
   * CANCELAR
   */

  $("cancelCategoryButton").addEventListener(
    "click",
    closeCategoryForm
  );

  $("cancelCategoryButtonBottom").addEventListener(
    "click",
    closeCategoryForm
  );

  /*
   * PREVIEW DA IMAGEM
   */

  $("categoryImage").addEventListener(
    "change",
    async event => {
      const file =
        event.target.files[0];

      if (!file) return;

      try {
        const image =
          await readFileAsDataURL(file);

        $("categoryPreview").src =
          image;

        $("categoryPreview").style.display =
          "block";
      } catch {
        showToast(
          "Não foi possível carregar a imagem."
        );
      }
    }
  );

  /*
   * =======================================================
   * SALVAR CATEGORIA
   * =======================================================
   *
   * Essa é a parte principal corrigida.
   */

  $("categoryForm").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      try {
        const name =
          $("categoryName")
            .value
            .trim();

        const manualId =
          $("categorySlug")
            .value
            .trim();

        const oldId =
          $("categoryId")
            .value
            .trim();

        const file =
          $("categoryImage")
            .files[0];

        /*
         * APENAS O NOME É NECESSÁRIO.
         */

        if (!name) {
          showToast(
            "Digite o nome da categoria."
          );

          $("categoryName").focus();

          return;
        }

        /*
         * =================================================
         * EDITANDO UMA CATEGORIA
         * =================================================
         */

        if (oldId) {
          const index =
            categories.findIndex(
              category =>
                String(category.id) ===
                String(oldId)
            );

          if (index !== -1) {
            let id =
              normalizeId(manualId);

            /*
             * Se não colocou ID,
             * mantém o ID atual.
             */

            if (!id) {
              id = categories[index].id;
            }

            /*
             * Se o novo ID já existe em outra categoria,
             * cria automaticamente outro.
             */

            const duplicate =
              categories.some(
                (category, categoryIndex) =>
                  categoryIndex !== index &&
                  String(category.id) ===
                    String(id)
              );

            if (duplicate) {
              id =
                createUniqueCategoryId(
                  name
                );
            }

            let image =
              categories[index].image || "";

            if (file) {
              image =
                await readFileAsDataURL(
                  file
                );
            }

            /*
             * Atualiza produtos se o ID mudou.
             */

            if (id !== oldId) {
              products.forEach(product => {
                if (
                  String(product.category) ===
                  String(oldId)
                ) {
                  product.category = id;
                }
              });
            }

            categories[index] = {
              id,
              name,
              image
            };

            /*
             * SALVA CATEGORIAS
             */

            const categorySaved =
              save(
                CATEGORIES_KEY,
                categories
              );

            /*
             * SALVA PRODUTOS
             */

            save(
              PRODUCTS_KEY,
              products
            );

            if (!categorySaved) {
              return;
            }

            renderAll();

            closeCategoryForm();

            showToast(
              "Categoria atualizada com sucesso."
            );

            return;
          }
        }

        /*
         * =================================================
         * CRIANDO UMA NOVA CATEGORIA
         * =================================================
         */

        /*
         * Se o usuário digitou um identificador,
         * tenta utilizá-lo.
         */

        let id =
          normalizeId(manualId);

        /*
         * Se não digitou identificador,
         * cria automaticamente.
         */

        if (!id) {
          id =
            createUniqueCategoryId(
              name
            );
        }

        /*
         * Se o ID manual já existir,
         * NÃO bloqueia a criação.
         *
         * Cria automaticamente outro.
         */

        const alreadyExists =
          categories.some(
            category =>
              String(category.id) ===
              String(id)
          );

        if (alreadyExists) {
          id =
            createUniqueCategoryId(
              name
            );
        }

        /*
         * IMAGEM
         */

        let image = "";

        if (file) {
          image =
            await readFileAsDataURL(
              file
            );
        }

        /*
         * CRIA A CATEGORIA
         */

        const newCategory = {
          id: id,
          name: name,
          image: image
        };

        /*
         * ADICIONA DIRETAMENTE AO ARRAY
         */

        categories.push(
          newCategory
        );

        /*
         * SALVA IMEDIATAMENTE
         */

        const saved =
          save(
            CATEGORIES_KEY,
            categories
          );

        /*
         * SE NÃO SALVOU,
         * REMOVE DO ARRAY PARA NÃO FICAR
         * APENAS NA MEMÓRIA.
         */

        if (!saved) {
          categories.pop();
          return;
        }

        /*
         * ATUALIZA TUDO
         */

        renderAll();

        /*
         * FECHA FORMULÁRIO
         */

        closeCategoryForm();

        /*
         * CONFIRMAÇÃO
         */

        showToast(
          `Categoria "${name}" criada com sucesso.`
        );

        console.log(
          "Categoria criada:",
          newCategory
        );

      } catch (error) {
        console.error(
          "ERRO AO CRIAR CATEGORIA:",
          error
        );

        showToast(
          "Erro ao criar a categoria. Veja o console."
        );
      }
    }
  );
}

/* =========================================================
   ABRIR CATEGORIA
========================================================= */

function openCategoryForm(
  category = null
) {
  $("categoryFormCard").hidden =
    false;

  $("categoryForm").reset();

  if (category) {
    $("categoryFormTitle")
      .textContent =
      "Editar categoria";

    $("categoryId").value =
      category.id;

    $("categoryName").value =
      category.name || "";

    $("categorySlug").value =
      category.id || "";

    $("categoryPreview").src =
      category.image || "";

    $("categoryPreview").style.display =
      category.image
        ? "block"
        : "none";
  } else {
    $("categoryFormTitle")
      .textContent =
      "Nova categoria";

    $("categoryId").value =
      "";

    $("categorySlug").value =
      "";

    $("categoryPreview")
      .removeAttribute("src");

    $("categoryPreview").style.display =
      "none";
  }

  $("categoryFormCard")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

/* =========================================================
   FECHAR CATEGORIA
========================================================= */

function closeCategoryForm() {
  $("categoryFormCard").hidden =
    true;

  $("categoryForm").reset();

  $("categoryId").value =
    "";

  $("categoryPreview")
    .removeAttribute("src");

  $("categoryPreview").style.display =
    "none";
}

/* =========================================================
   RENDERIZAR CATEGORIAS
========================================================= */

function renderCategories() {
  const container =
    $("categoriesEditor");

  container.innerHTML = "";

  if (!categories.length) {
    container.innerHTML = `
      <div class="empty-editor">
        Nenhuma categoria cadastrada.
      </div>
    `;

    return;
  }

  categories.forEach(category => {
    const item =
      document.createElement("div");

    item.className =
      "editor-item";

    item.innerHTML = `
      <div class="editor-item-main">

        ${
          category.image
            ? `
              <img
                class="editor-item-image"
                src="${escapeAttribute(
                  category.image
                )}"
                alt="${escapeAttribute(
                  category.name
                )}"
              >
            `
            : `
              <div class="editor-item-image"></div>
            `
        }

        <div>
          <h3>
            ${escapeHTML(
              category.name
            )}
          </h3>

          <p>
            ID:
            ${escapeHTML(
              category.id
            )}
          </p>
        </div>

      </div>

      <div class="editor-actions">

        <button data-action="edit">
          Editar
        </button>

        <button
          class="delete-button"
          data-action="delete"
        >
          Remover
        </button>

      </div>
    `;

    item
      .querySelector(
        '[data-action="edit"]'
      )
      .addEventListener(
        "click",
        () => {
          openCategoryForm(
            category
          );
        }
      );

    item
      .querySelector(
        '[data-action="delete"]'
      )
      .addEventListener(
        "click",
        () => {
          removeCategory(
            category.id
          );
        }
      );

    container.appendChild(item);
  });
}

/* =========================================================
   REMOVER CATEGORIA
========================================================= */

function removeCategory(id) {
  const hasProducts =
    products.some(
      product =>
        String(product.category) ===
        String(id)
    );

  if (hasProducts) {
    showToast(
      "Remova ou altere os produtos dessa categoria primeiro."
    );

    return;
  }

  if (
    !confirm(
      "Deseja remover esta categoria?"
    )
  ) {
    return;
  }

  categories =
    categories.filter(
      category =>
        String(category.id) !==
        String(id)
    );

  save(
    CATEGORIES_KEY,
    categories
  );

  renderAll();

  showToast(
    "Categoria removida."
  );
}

/* =========================================================
   PRODUTOS
========================================================= */

function setupProductForm() {
  $("newProductButton").addEventListener(
    "click",
    () => {
      openProductForm();
    }
  );

  $("cancelProductButton").addEventListener(
    "click",
    closeProductForm
  );

  $("cancelProductButtonBottom").addEventListener(
    "click",
    closeProductForm
  );

  $("productImage").addEventListener(
    "change",
    async event => {
      const file =
        event.target.files[0];

      if (!file) return;

      try {
        const image =
          await readFileAsDataURL(file);

        $("productPreview").src =
          image;

        $("productPreview").style.display =
          "block";
      } catch {
        showToast(
          "Não foi possível carregar a imagem do produto."
        );
      }
    }
  );

  $("productForm").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const name =
        $("productName")
          .value
          .trim();

      const category =
        $("productCategory")
          .value;

      const idValue =
        $("productId")
          .value;

      const mainImageFile =
        $("productImage")
          .files[0];

      const additionalFiles =
        Array.from(
          $("productImages").files
        );

      if (!name || !category) {
        showToast(
          "Preencha o nome e a categoria."
        );

        return;
      }

      const existingProduct =
        products.find(
          product =>
            Number(product.id) ===
            Number(idValue)
        );

      let image =
        existingProduct?.image ||
        "";

      if (mainImageFile) {
        image =
          await readFileAsDataURL(
            mainImageFile
          );
      }

      let images =
        existingProduct?.images ||
        [];

      if (
        additionalFiles.length
      ) {
        images =
          await Promise.all(
            additionalFiles.map(
              file =>
                readFileAsDataURL(
                  file
                )
            )
          );
      }

      const product = {
        id: idValue
          ? Number(idValue)
          : getNextProductId(),

        name,

        category,

        price:
          Number(
            $("productPrice")
              .value || 0
          ),

        oldPrice:
          Number(
            $("productOldPrice")
              .value || 0
          ),

        rating:
          $("productRating")
            .value
            .trim() || "5.0",

        status:
          $("productStatus")
            .value,

        image,

        images,

        purchaseLink:
          $("productPurchaseLink")
            .value
            .trim() || "#",

        descriptionTitle:
          $("productDescriptionTitle")
            .value
            .trim(),

        description:
          $("productDescription")
            .value
            .trim()
      };

      const index =
        products.findIndex(
          item =>
            Number(item.id) ===
            Number(product.id)
        );

      if (index >= 0) {
        products[index] =
          product;
      } else {
        products.push(
          product
        );
      }

      save(
        PRODUCTS_KEY,
        products
      );

      renderAll();

      closeProductForm();

      showToast(
        "Produto salvo."
      );
    }
  );
}

/* =========================================================
   ABRIR PRODUTO
========================================================= */

function openProductForm(
  product = null
) {
  $("productFormCard").hidden =
    false;

  fillCategorySelect();

  $("productForm").reset();

  if (product) {
    $("productFormTitle")
      .textContent =
      "Editar produto";

    $("productId").value =
      product.id;

    $("productName").value =
      product.name || "";

    $("productCategory").value =
      product.category || "";

    $("productPrice").value =
      product.price || 0;

    $("productOldPrice").value =
      product.oldPrice || 0;

    $("productRating").value =
      product.rating || "5.0";

    $("productStatus").value =
      product.status || "active";

    $("productPurchaseLink").value =
      product.purchaseLink || "";

    $("productDescriptionTitle").value =
      product.descriptionTitle || "";

    $("productDescription").value =
      product.description || "";

    $("productPreview").src =
      product.image || "";

    $("productPreview").style.display =
      product.image
        ? "block"
        : "none";
  } else {
    $("productFormTitle")
      .textContent =
      "Novo produto";

    $("productId").value =
      "";

    $("productStatus").value =
      "active";

    $("productRating").value =
      "5.0";

    $("productPreview")
      .removeAttribute("src");

    $("productPreview").style.display =
      "none";
  }

  $("productFormCard")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

/* =========================================================
   FECHAR PRODUTO
========================================================= */

function closeProductForm() {
  $("productFormCard").hidden =
    true;

  $("productForm").reset();

  $("productId").value =
    "";

  $("productPreview")
    .removeAttribute("src");

  $("productPreview").style.display =
    "none";
}

/* =========================================================
   SELECT CATEGORIAS
========================================================= */

function fillCategorySelect() {
  const select =
    $("productCategory");

  if (!select) return;

  select.innerHTML = "";

  categories.forEach(category => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      category.id;

    option.textContent =
      category.name;

    select.appendChild(
      option
    );
  });
}

/* =========================================================
   RENDERIZAR PRODUTOS
========================================================= */

function renderProducts() {
  const container =
    $("productsEditor");

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-editor">
        Nenhum produto cadastrado.
      </div>
    `;

    return;
  }

  products.forEach(product => {
    const category =
      categories.find(
        item =>
          item.id ===
          product.category
      );

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "editor-item";

    item.innerHTML = `
      <div class="editor-item-main">

        ${
          product.image
            ? `
              <img
                class="editor-item-image"
                src="${escapeAttribute(
                  product.image
                )}"
                alt="${escapeAttribute(
                  product.name
                )}"
              >
            `
            : `
              <div class="editor-item-image"></div>
            `
        }

        <div>

          <h3>
            ${escapeHTML(
              product.name
            )}
          </h3>

          <p>
            ${escapeHTML(
              category
                ? category.name
                : product.category
            )}

            · R$
            ${Number(
              product.price || 0
            )
              .toFixed(2)
              .replace(
                ".",
                ","
              )}
          </p>

        </div>

      </div>

      <div class="editor-actions">

        <button data-action="edit">
          Editar
        </button>

        <button
          class="delete-button"
          data-action="delete"
        >
          Remover
        </button>

      </div>
    `;

    item
      .querySelector(
        '[data-action="edit"]'
      )
      .addEventListener(
        "click",
        () => {
          openProductForm(
            product
          );
        }
      );

    item
      .querySelector(
        '[data-action="delete"]'
      )
      .addEventListener(
        "click",
        () => {
          removeProduct(
            product.id
          );
        }
      );

    container.appendChild(item);
  });
}

/* =========================================================
   REMOVER PRODUTO
========================================================= */

function removeProduct(id) {
  if (
    !confirm(
      "Deseja remover este produto?"
    )
  ) {
    return;
  }

  products =
    products.filter(
      product =>
        product.id !== id
    );

  save(
    PRODUCTS_KEY,
    products
  );

  renderAll();

  showToast(
    "Produto removido."
  );
}

/* =========================================================
   PRÓXIMO ID PRODUTO
========================================================= */

function getNextProductId() {
  return products.reduce(
    (max, product) => {
      return Math.max(
        max,
        Number(product.id) || 0
      );
    },
    0
  ) + 1;
}

/* =========================================================
   SUPORTE
========================================================= */

function setupSupportForm() {
  $("supportForm").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      config.discord =
        $("discord")
          .value
          .trim();

      config.whatsapp =
        $("whatsapp")
          .value
          .trim();

      config.tiktok =
        $("tiktok")
          .value
          .trim();

      config.instagram =
        $("instagram")
          .value
          .trim();

      if (
        save(
          CONFIG_KEY,
          config
        )
      ) {
        showToast(
          "Links de suporte salvos."
        );
      }
    }
  );
}

function loadSupportForm() {
  if (!$("discord")) return;

  $("discord").value =
    config.discord || "";

  $("whatsapp").value =
    config.whatsapp || "";

  $("tiktok").value =
    config.tiktok || "";

  $("instagram").value =
    config.instagram || "";
}

/* =========================================================
   SALVAR TUDO
========================================================= */

function saveEverything() {
  const productsSaved =
    save(
      PRODUCTS_KEY,
      products
    );

  const categoriesSaved =
    save(
      CATEGORIES_KEY,
      categories
    );

  const configSaved =
    save(
      CONFIG_KEY,
      config
    );

  return (
    productsSaved &&
    categoriesSaved &&
    configSaved
  );
}

/* =========================================================
   RENDERIZAR TUDO
========================================================= */

function renderAll() {
  updateOverview();

  loadStoreForm();

  loadSupportForm();

  renderCategories();

  renderProducts();

  fillCategorySelect();
}

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
  const toast =
    $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        toast.classList.remove(
          "show"
        );
      },
      2600
    );
}
