```js
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


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

const $ = id => document.getElementById(id);


function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}


function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return clone(fallback);
    }

    const parsed = JSON.parse(saved);

    return parsed;

  } catch (error) {
    console.error(`Erro ao carregar ${key}:`, error);

    return clone(fallback);
  }
}


/* =========================================================
   SALVAMENTO SEGURO
   ========================================================= */

function save(key, value) {
  try {
    const data = JSON.stringify(value);

    localStorage.setItem(key, data);

    return true;

  } catch (error) {

    console.error(`Erro ao salvar ${key}:`, error);

    const message =
      String(error?.message || "").toLowerCase();

    if (
      error?.name === "QuotaExceededError" ||
      error?.code === 22 ||
      message.includes("quota") ||
      message.includes("storage")
    ) {

      showToast(
        "Armazenamento cheio. Tente remover imagens antigas."
      );

    } else {

      showToast(
        "Não foi possível salvar os dados."
      );

    }

    return false;
  }
}


/* =========================================================
   IMAGEM
   ========================================================= */

/*
 * Converte imagem para Base64.
 *
 * A imagem é redimensionada e comprimida antes
 * de ser armazenada no localStorage.
 *
 * Isso evita ocupar espaço desnecessário.
 */

function readFileAsDataURL(file, maxWidth = 1200, quality = 0.75) {

  return new Promise((resolve, reject) => {

    if (!file) {
      resolve("");
      return;
    }


    if (!file.type.startsWith("image/")) {
      reject(
        new Error("O arquivo selecionado não é uma imagem.")
      );
      return;
    }


    const reader = new FileReader();


    reader.onload = event => {

      const image = new Image();


      image.onload = () => {

        try {

          let width = image.width;
          let height = image.height;


          if (width > maxWidth) {

            const ratio =
              maxWidth / width;

            width =
              Math.round(width * ratio);

            height =
              Math.round(height * ratio);

          }


          const canvas =
            document.createElement("canvas");


          canvas.width =
            width;

          canvas.height =
            height;


          const context =
            canvas.getContext("2d");


          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          const compressed =
            canvas.toDataURL(
              "image/jpeg",
              quality
            );


          resolve(compressed);

        } catch (error) {

          reject(error);

        }

      };


      image.onerror = () => {

        reject(
          new Error("Não foi possível processar a imagem.")
        );

      };


      image.src =
        event.target.result;

    };


    reader.onerror = () => {

      reject(
        new Error("Erro ao ler a imagem.")
      );

    };


    reader.readAsDataURL(file);

  });

}


/* =========================================================
   IDENTIFICADOR
   ========================================================= */

function normalizeId(value) {

  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

}


function generateCategoryId(name, currentId = "") {

  let baseId =
    normalizeId(name);


  if (!baseId) {
    baseId = "categoria";
  }


  let id =
    baseId;


  let number =
    2;


  while (
    categories.some(category =>
      String(category.id) === String(id) &&
      String(category.id) !== String(currentId)
    )
  ) {

    id =
      `${baseId}-${number}`;

    number++;

  }


  return id;

}


/* =========================================================
   SEGURANÇA HTML
   ========================================================= */

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
   DADOS
   ========================================================= */

let products =
  load(
    PRODUCTS_KEY,
    defaultProducts
  );


let categories =
  load(
    CATEGORIES_KEY,
    defaultCategories
  );


let config = {
  ...defaultConfig,
  ...load(
    CONFIG_KEY,
    defaultConfig
  )
};


/* =========================================================
   CORREÇÃO DE DADOS ANTIGOS
   ========================================================= */

if (!Array.isArray(products)) {
  products = clone(defaultProducts);
}


if (!Array.isArray(categories)) {
  categories = clone(defaultCategories);
}


function normalizeExistingCategories() {

  const usedIds = new Set();


  categories =
    categories.map(
      category => {

        let name =
          String(
            category?.name || "Categoria"
          ).trim();


        let id =
          normalizeId(
            category?.id || ""
          );


        if (!id) {

          id =
            generateUniqueIdForSet(
              name,
              usedIds
            );

        }


        if (usedIds.has(id)) {

          id =
            generateUniqueIdForSet(
              name,
              usedIds
            );

        }


        usedIds.add(id);


        return {
          id,
          name,
          image:
            category?.image || ""
        };

      }
    );

}


function generateUniqueIdForSet(name, usedIds) {

  let base =
    normalizeId(name) ||
    "categoria";


  let id =
    base;


  let number =
    2;


  while (usedIds.has(id)) {

    id =
      `${base}-${number}`;

    number++;

  }


  return id;

}


normalizeExistingCategories();


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupNavigation();

    setupOverview();

    setupStoreForm();

    setupCategoryForm();

    setupProductForm();

    setupSupportForm();

    renderAll();

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
    .querySelectorAll("[data-go-section]")
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


  const pageTitle =
    $("pageTitle");


  if (pageTitle) {

    pageTitle.textContent =
      titles[section] || "Dashboard";

  }

}


/* =========================================================
   VISÃO GERAL
   ========================================================= */

function setupOverview() {

  const saveButton =
    $("saveAllButton");


  if (!saveButton) return;


  saveButton.addEventListener(
    "click",
    () => {

      const result =
        saveEverything();


      if (result) {

        showToast(
          "Todas as alterações foram salvas."
        );

      }

    }
  );

}


function updateOverview() {

  const categoriesElement =
    $("overviewCategories");


  const productsElement =
    $("overviewProducts");


  const activeProductsElement =
    $("overviewActiveProducts");


  if (categoriesElement) {

    categoriesElement.textContent =
      categories.length;

  }


  if (productsElement) {

    productsElement.textContent =
      products.length;

  }


  if (activeProductsElement) {

    activeProductsElement.textContent =
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

  const heroInput =
    $("heroImage");


  if (heroInput) {

    heroInput.addEventListener(
      "change",
      async event => {

        const file =
          event.target.files[0];


        if (!file) return;


        try {

          const image =
            await readFileAsDataURL(
              file,
              1600,
              0.75
            );


          const preview =
            $("heroPreview");


          if (preview) {

            preview.src =
              image;

            preview.style.display =
              "block";

          }

        } catch (error) {

          console.error(error);

          showToast(
            "Não foi possível carregar o banner."
          );

        }

      }
    );

  }


  const storeForm =
    $("storeForm");


  if (!storeForm) return;


  storeForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      try {

        const heroInput =
          $("heroImage");


        const file =
          heroInput?.files?.[0];


        if (file) {

          config.heroImage =
            await readFileAsDataURL(
              file,
              1600,
              0.75
            );

        }


        config.storeName =
          $("storeName")
            ?.value
            ?.trim() || "";


        config.storeDescription =
          $("storeDescription")
            ?.value
            ?.trim() || "";


        const saved =
          save(
            CONFIG_KEY,
            config
          );


        if (!saved) return;


        showToast(
          "Dados da loja salvos."
        );


      } catch (error) {

        console.error(error);

        showToast(
          "Erro ao salvar os dados da loja."
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


  const preview =
    $("heroPreview");


  if (!preview) return;


  preview.src =
    config.heroImage || "";


  preview.style.display =
    config.heroImage
      ? "block"
      : "none";

}


/* =========================================================
   CATEGORIAS
   ========================================================= */

function setupCategoryForm() {

  const newButton =
    $("newCategoryButton");


  if (newButton) {

    newButton.addEventListener(
      "click",
      () => {

        openCategoryForm();

      }
    );

  }


  const cancelButton =
    $("cancelCategoryButton");


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeCategoryForm
    );

  }


  const cancelBottom =
    $("cancelCategoryButtonBottom");


  if (cancelBottom) {

    cancelBottom.addEventListener(
      "click",
      closeCategoryForm
    );

  }


  const imageInput =
    $("categoryImage");


  if (imageInput) {

    imageInput.addEventListener(
      "change",
      async event => {

        const file =
          event.target.files[0];


        if (!file) return;


        try {

          const image =
            await readFileAsDataURL(
              file,
              900,
              0.72
            );


          const preview =
            $("categoryPreview");


          if (preview) {

            preview.src =
              image;

            preview.style.display =
              "block";

          }

        } catch (error) {

          console.error(error);

          showToast(
            "Não foi possível carregar a imagem."
          );

        }

      }
    );

  }


  const categoryForm =
    $("categoryForm");


  if (!categoryForm) return;


  categoryForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      try {

        const name =
          $("categoryName")
            ?.value
            ?.trim() || "";


        const oldId =
          $("categoryId")
            ?.value
            ?.trim() || "";


        const file =
          $("categoryImage")
            ?.files?.[0];


        /*
         * O identificador NÃO é obrigatório.
         * Somente o nome é necessário.
         */

        if (!name) {

          showToast(
            "Digite o nome da categoria."
          );

          $("categoryName")?.focus();

          return;

        }


        /*
         * Se estamos editando, mantém o ID.
         *
         * Se estamos criando, gera automaticamente.
         */

        let id;


        if (oldId) {

          id =
            oldId;

        } else {

          id =
            generateCategoryId(
              name
            );

        }


        /*
         * Imagem
         */

        let image =
          "";


        if (file) {

          image =
            await readFileAsDataURL(
              file,
              900,
              0.72
            );

        } else if (oldId) {

          const oldCategory =
            categories.find(
              category =>
                String(category.id) ===
                String(oldId)
            );


          if (oldCategory) {

            image =
              oldCategory.image || "";

          }

        }


        /*
         * Categoria final
         */

        const category = {

          id:
            id,

          name:
            name,

          image:
            image

        };


        /*
         * Verifica se estamos editando.
         */

        const existingIndex =
          categories.findIndex(
            item =>
              String(item.id) ===
              String(oldId)
          );


        if (
          oldId &&
          existingIndex >= 0
        ) {

          /*
           * Editar categoria
           */

          categories[existingIndex] =
            category;

        } else {

          /*
           * Criar categoria
           */

          categories.push(
            category
          );

        }


        /*
         * Salva as categorias.
         */

        const categoriesSaved =
          save(
            CATEGORIES_KEY,
            categories
          );


        /*
         * Se não conseguiu salvar,
         * não continua.
         */

        if (!categoriesSaved) {

          /*
           * Recarrega o estado anterior
           * caso o localStorage tenha recusado.
           */

          categories =
            load(
              CATEGORIES_KEY,
              categories
            );

          renderAll();

          return;

        }


        /*
         * Se o ID mudou, atualiza os produtos.
         */

        if (
          oldId &&
          oldId !== id
        ) {

          products.forEach(
            product => {

              if (
                String(product.category) ===
                String(oldId)
              ) {

                product.category =
                  id;

              }

            }
          );


          save(
            PRODUCTS_KEY,
            products
          );

        }


        /*
         * Atualiza a interface.
         */

        renderAll();


        closeCategoryForm();


        showToast(
          oldId
            ? "Categoria atualizada com sucesso."
            : "Categoria criada com sucesso."
        );


        console.log(
          "Categoria salva:",
          category
        );


      } catch (error) {

        console.error(
          "ERRO AO CRIAR CATEGORIA:",
          error
        );


        showToast(
          `Erro ao criar categoria: ${
            error?.message || "erro desconhecido"
          }`
        );

      }

    }
  );

}


/* =========================================================
   ABRIR FORMULÁRIO DE CATEGORIA
   ========================================================= */

function openCategoryForm(category = null) {

  const formCard =
    $("categoryFormCard");


  const form =
    $("categoryForm");


  if (!formCard || !form) return;


  formCard.hidden =
    false;


  form.reset();


  if (category) {

    $("categoryFormTitle")
      .textContent =
      "Editar categoria";


    $("categoryId").value =
      category.id;


    $("categoryName").value =
      category.name || "";


    const preview =
      $("categoryPreview");


    if (preview) {

      preview.src =
        category.image || "";


      preview.style.display =
        category.image
          ? "block"
          : "none";

    }

  } else {

    $("categoryFormTitle")
      .textContent =
      "Nova categoria";


    $("categoryId").value =
      "";


    const preview =
      $("categoryPreview");


    if (preview) {

      preview.removeAttribute(
        "src"
      );


      preview.style.display =
        "none";

    }

  }


  formCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });


  setTimeout(
    () => {

      $("categoryName")?.focus();

    },
    300
  );

}


/* =========================================================
   FECHAR FORMULÁRIO DE CATEGORIA
   ========================================================= */

function closeCategoryForm() {

  const formCard =
    $("categoryFormCard");


  const form =
    $("categoryForm");


  if (!formCard) return;


  formCard.hidden =
    true;


  if (form) {
    form.reset();
  }


  if ($("categoryId")) {

    $("categoryId").value =
      "";

  }


  const preview =
    $("categoryPreview");


  if (preview) {

    preview.removeAttribute(
      "src"
    );


    preview.style.display =
      "none";

  }

}


/* =========================================================
   RENDERIZAR CATEGORIAS
   ========================================================= */

function renderCategories() {

  const container =
    $("categoriesEditor");


  if (!container) return;


  container.innerHTML =
    "";


  if (!categories.length) {

    container.innerHTML = `
      <div class="empty-editor">
        Nenhuma categoria cadastrada.
      </div>
    `;

    return;

  }


  categories.forEach(
    category => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="editor-item-main">

          ${
            category.image

              ? `
                <img
                  class="editor-item-image"
                  src="${escapeAttribute(category.image)}"
                  alt="${escapeAttribute(category.name)}"
                >
              `

              : `
                <div class="editor-item-image"></div>
              `
          }

          <div>

            <h3>
              ${escapeHTML(category.name)}
            </h3>

            <p>
              Identificador interno:
              ${escapeHTML(category.id)}
            </p>

          </div>

        </div>

        <div class="editor-actions">

          <button
            type="button"
            data-action="edit"
          >
            Editar
          </button>

          <button
            type="button"
            class="delete-button"
            data-action="delete"
          >
            Remover
          </button>

        </div>

      `;


      const editButton =
        item.querySelector(
          '[data-action="edit"]'
        );


      const deleteButton =
        item.querySelector(
          '[data-action="delete"]'
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            openCategoryForm(
              category
            );

          }
        );

      }


      if (deleteButton) {

        deleteButton.addEventListener(
          "click",
          () => {

            removeCategory(
              category.id
            );

          }
        );

      }


      container.appendChild(
        item
      );

    }
  );

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


  const confirmed =
    confirm(
      "Deseja remover esta categoria?"
    );


  if (!confirmed) {
    return;
  }


  const previousCategories =
    categories;


  categories =
    categories.filter(
      category =>
        String(category.id) !==
        String(id)
    );


  const saved =
    save(
      CATEGORIES_KEY,
      categories
    );


  if (!saved) {

    categories =
      previousCategories;

    renderAll();

    return;

  }


  renderAll();


  showToast(
    "Categoria removida."
  );

}


/* =========================================================
   PRODUTOS
   ========================================================= */

function setupProductForm() {

  const newButton =
    $("newProductButton");


  if (newButton) {

    newButton.addEventListener(
      "click",
      () => {

        openProductForm();

      }
    );

  }


  const cancelButton =
    $("cancelProductButton");


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeProductForm
    );

  }


  const cancelBottom =
    $("cancelProductButtonBottom");


  if (cancelBottom) {

    cancelBottom.addEventListener(
      "click",
      closeProductForm
    );

  }


  const imageInput =
    $("productImage");


  if (imageInput) {

    imageInput.addEventListener(
      "change",
      async event => {

        const file =
          event.target.files[0];


        if (!file) return;


        try {

          const image =
            await readFileAsDataURL(
              file,
              1000,
              0.72
            );


          const preview =
            $("productPreview");


          if (preview) {

            preview.src =
              image;


            preview.style.display =
              "block";

          }

        } catch (error) {

          console.error(error);

          showToast(
            "Não foi possível carregar a imagem."
          );

        }

      }
    );

  }


  const productForm =
    $("productForm");


  if (!productForm) return;


  productForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      try {

        const name =
          $("productName")
            ?.value
            ?.trim() || "";


        const category =
          $("productCategory")
            ?.value || "";


        const idValue =
          $("productId")
            ?.value || "";


        const mainImageFile =
          $("productImage")
            ?.files?.[0];


        const additionalFiles =
          $("productImages")
            ? Array.from(
                $("productImages").files || []
              )
            : [];


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
              mainImageFile,
              1000,
              0.72
            );

        }


        let images =
          existingProduct?.images ||
          [];


        if (additionalFiles.length) {

          images =
            await Promise.all(
              additionalFiles.map(
                file =>
                  readFileAsDataURL(
                    file,
                    1000,
                    0.72
                  )
              )
            );

        }


        const product = {

          id:
            idValue
              ? Number(idValue)
              : getNextProductId(),

          name,

          category,

          price:
            Number(
              $("productPrice")
                ?.value || 0
            ),

          oldPrice:
            Number(
              $("productOldPrice")
                ?.value || 0
            ),

          rating:
            $("productRating")
              ?.value
              ?.trim() || "5.0",

          status:
            $("productStatus")
              ?.value || "active",

          image,

          images,

          purchaseLink:
            $("productPurchaseLink")
              ?.value
              ?.trim() || "#",

          descriptionTitle:
            $("productDescriptionTitle")
              ?.value
              ?.trim() || "",

          description:
            $("productDescription")
              ?.value
              ?.trim() || ""

        };


        const index =
          products.findIndex(
            item =>
              Number(item.id) ===
              Number(product.id)
          );


        const previousProducts =
          [...products];


        if (index >= 0) {

          products[index] =
            product;

        } else {

          products.push(
            product
          );

        }


        const saved =
          save(
            PRODUCTS_KEY,
            products
          );


        if (!saved) {

          products =
            previousProducts;

          renderAll();

          return;

        }


        renderAll();


        closeProductForm();


        showToast(
          "Produto salvo."
        );


      } catch (error) {

        console.error(
          "Erro ao salvar produto:",
          error
        );


        showToast(
          `Erro ao salvar produto: ${
            error?.message || "erro desconhecido"
          }`
        );

      }

    }
  );

}


/* =========================================================
   ABRIR PRODUTO
   ========================================================= */

function openProductForm(product = null) {

  const card =
    $("productFormCard");


  const form =
    $("productForm");


  if (!card || !form) return;


  card.hidden =
    false;


  fillCategorySelect();


  form.reset();


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


    const preview =
      $("productPreview");


    if (preview) {

      preview.src =
        product.image || "";


      preview.style.display =
        product.image
          ? "block"
          : "none";

    }

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


    const preview =
      $("productPreview");


    if (preview) {

      preview.removeAttribute(
        "src"
      );


      preview.style.display =
        "none";

    }

  }


  card.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   FECHAR PRODUTO
   ========================================================= */

function closeProductForm() {

  const card =
    $("productFormCard");


  const form =
    $("productForm");


  if (!card) return;


  card.hidden =
    true;


  if (form) {
    form.reset();
  }


  if ($("productId")) {

    $("productId").value =
      "";

  }


  const preview =
    $("productPreview");


  if (preview) {

    preview.removeAttribute(
      "src"
    );


    preview.style.display =
      "none";

  }

}


/* =========================================================
   SELECT DE CATEGORIAS
   ========================================================= */

function fillCategorySelect() {

  const select =
    $("productCategory");


  if (!select) return;


  select.innerHTML =
    "";


  if (!categories.length) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      "";


    option.textContent =
      "Nenhuma categoria cadastrada";


    select.appendChild(
      option
    );


    return;

  }


  categories.forEach(
    category => {

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

    }
  );

}


/* =========================================================
   RENDERIZAR PRODUTOS
   ========================================================= */

function renderProducts() {

  const container =
    $("productsEditor");


  if (!container) return;


  container.innerHTML =
    "";


  if (!products.length) {

    container.innerHTML = `
      <div class="empty-editor">
        Nenhum produto cadastrado.
      </div>
    `;

    return;

  }


  products.forEach(
    product => {

      const category =
        categories.find(
          item =>
            String(item.id) ===
            String(product.category)
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
                  src="${escapeAttribute(product.image)}"
                  alt="${escapeAttribute(product.name)}"
                >
              `

              : `
                <div class="editor-item-image"></div>
              `
          }

          <div>

            <h3>
              ${escapeHTML(product.name)}
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
                .replace(".", ",")}

            </p>

          </div>

        </div>

        <div class="editor-actions">

          <button
            type="button"
            data-action="edit"
          >
            Editar
          </button>

          <button
            type="button"
            class="delete-button"
            data-action="delete"
          >
            Remover
          </button>

        </div>

      `;


      const editButton =
        item.querySelector(
          '[data-action="edit"]'
        );


      const deleteButton =
        item.querySelector(
          '[data-action="delete"]'
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            openProductForm(
              product
            );

          }
        );

      }


      if (deleteButton) {

        deleteButton.addEventListener(
          "click",
          () => {

            removeProduct(
              product.id
            );

          }
        );

      }


      container.appendChild(
        item
      );

    }
  );

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


  const previousProducts =
    products;


  products =
    products.filter(
      product =>
        Number(product.id) !==
        Number(id)
    );


  const saved =
    save(
      PRODUCTS_KEY,
      products
    );


  if (!saved) {

    products =
      previousProducts;

    renderAll();

    return;

  }


  renderAll();


  showToast(
    "Produto removido."
  );

}


/* =========================================================
   PRÓXIMO ID
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

  const form =
    $("supportForm");


  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      config.discord =
        $("discord")
          ?.value
          ?.trim() || "";


      config.whatsapp =
        $("whatsapp")
          ?.value
          ?.trim() || "";


      config.tiktok =
        $("tiktok")
          ?.value
          ?.trim() || "";


      config.instagram =
        $("instagram")
          ?.value
          ?.trim() || "";


      const saved =
        save(
          CONFIG_KEY,
          config
        );


      if (!saved) return;


      showToast(
        "Links de suporte salvos."
      );

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


  if (!productsSaved) {
    return false;
  }


  const categoriesSaved =
    save(
      CATEGORIES_KEY,
      categories
    );


  if (!categoriesSaved) {
    return false;
  }


  const configSaved =
    save(
      CONFIG_KEY,
      config
    );


  if (!configSaved) {
    return false;
  }


  return true;

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

    console.log(message);

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
      3000
    );

}
```
