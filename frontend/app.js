const productContainer =
    document.getElementById("product-container");

const apiBadge =
    document.getElementById("api-badge");

const backendStatus =
    document.getElementById("backend-status");

const databaseStatus =
    document.getElementById("database-status");

const backendDot =
    document.getElementById("backend-dot");

const databaseDot =
    document.getElementById("database-dot");

const cartCount =
    document.getElementById("cart-count");

const cartButton =
    document.getElementById("cart-button");

const cartModal =
    document.getElementById("cart-modal");

const closeCart =
    document.getElementById("close-cart");

const cartItems =
    document.getElementById("cart-items");

const cartTotal =
    document.getElementById("cart-total");


let cart = [];


/* ==========================================
   DEMO PRODUCTS

   These products are displayed when the
   Flask backend is not running.

   Later the products will come from:

   /api/products
========================================== */

const fallbackProducts = [

    {
        id: 1,
        name: "Laptop",
        category: "Computers",

        description:
            "Powerful laptop for work, development and everyday use.",

        price: 899,

        icon: "💻"
    },

    {
        id: 2,
        name: "Wireless Headphones",
        category: "Audio",

        description:
            "Comfortable wireless headphones with high-quality sound.",

        price: 99,

        icon: "🎧"
    },

    {
        id: 3,
        name: "Smart Watch",
        category: "Wearables",

        description:
            "Track activities, notifications and stay connected.",

        price: 199,

        icon: "⌚"
    }

];


/* ==========================================
   DISPLAY PRODUCTS
========================================== */

function displayProducts(products) {

    productContainer.innerHTML = "";


    products.forEach(product => {

        const card =
            document.createElement("article");


        card.className =
            "product-card";


        card.innerHTML = `

            <div class="product-image">

                ${product.icon || "📦"}

            </div>


            <div class="product-content">

                <span class="product-category">

                    ${product.category || "Product"}

                </span>


                <h3>

                    ${product.name}

                </h3>


                <p class="product-description">

                    ${product.description || ""}

                </p>


                <div class="product-bottom">

                    <span class="price">

                        $${Number(product.price).toFixed(2)}

                    </span>


                    <button class="add-button">

                        Add to Cart

                    </button>

                </div>

            </div>

        `;


        const button =
            card.querySelector(".add-button");


        button.addEventListener(
            "click",
            () => {

                addToCart(product);


                button.textContent =
                    "Added ✓";


                setTimeout(
                    () => {

                        button.textContent =
                            "Add to Cart";

                    },
                    900
                );

            }
        );


        productContainer.appendChild(card);

    });

}


/* ==========================================
   ADD PRODUCT TO CART
========================================== */

function addToCart(product) {

    cart.push(product);

    updateCart();

}


/* ==========================================
   UPDATE CART
========================================== */

function updateCart() {

    cartCount.textContent =
        cart.length;


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <p class="empty-cart">

                Your cart is empty.

            </p>

        `;


        cartTotal.textContent =
            "$0.00";


        return;

    }


    cartItems.innerHTML = "";


    let total = 0;


    cart.forEach(
        (product, index) => {

            total +=
                Number(product.price);


            const item =
                document.createElement("div");


            item.className =
                "cart-item";


            item.innerHTML = `

                <div class="cart-item-info">

                    <strong>

                        ${product.icon || "📦"}
                        ${product.name}

                    </strong>

                    <span>

                        $${Number(product.price).toFixed(2)}

                    </span>

                </div>


                <button
                    class="remove-button"
                    data-index="${index}"
                >

                    Remove

                </button>

            `;


            const removeButton =
                item.querySelector(
                    ".remove-button"
                );


            removeButton.addEventListener(
                "click",
                () => {

                    removeFromCart(index);

                }
            );


            cartItems.appendChild(item);

        }
    );


    cartTotal.textContent =
        `$${total.toFixed(2)}`;

}


/* ==========================================
   REMOVE PRODUCT
========================================== */

function removeFromCart(index) {

    cart.splice(index, 1);

    updateCart();

}


/* ==========================================
   OPEN CART
========================================== */

cartButton.addEventListener(
    "click",
    () => {

        cartModal.classList.add("show");

    }
);


/* ==========================================
   CLOSE CART
========================================== */

closeCart.addEventListener(
    "click",
    () => {

        cartModal.classList.remove("show");

    }
);


/* Close when clicking outside the cart */

cartModal.addEventListener(
    "click",
    event => {

        if (event.target === cartModal) {

            cartModal.classList.remove("show");

        }

    }
);


/* ==========================================
   LOAD PRODUCTS FROM BACKEND
========================================== */

async function loadProducts() {

    try {

        const response =
            await fetch("/api/products");


        if (!response.ok) {

            throw new Error(
                "API unavailable"
            );

        }


        const products =
            await response.json();


        displayProducts(products);


        apiBadge.textContent =
            "● API Connected";


        apiBadge.className =
            "api-badge online";

    }

    catch (error) {

        /*
        Backend is not running yet.

        Display local demo products.
        */

        displayProducts(
            fallbackProducts
        );


        apiBadge.textContent =
            "● Demo Mode";


        apiBadge.className =
            "api-badge checking";

    }

}


/* ==========================================
   CHECK BACKEND AND DATABASE
========================================== */

async function checkHealth() {

    try {

        const response =
            await fetch("/api/health");


        if (!response.ok) {

            throw new Error(
                "Backend unavailable"
            );

        }


        const data =
            await response.json();


        backendStatus.textContent =
            data.api || "Connected";


        backendDot.classList.add(
            "online"
        );


        if (
            data.database ===
            "connected"
        ) {

            databaseStatus.textContent =
                "Connected to Amazon RDS";


            databaseDot.classList.add(
                "online"
            );

        }

        else {

            databaseStatus.textContent =
                "Database connection unavailable";


            databaseDot.classList.add(
                "offline"
            );

        }

    }

    catch (error) {

        backendStatus.textContent =
            "Backend not connected - local demo mode";


        databaseStatus.textContent =
            "RDS connection will be configured during deployment";


        backendDot.classList.add(
            "offline"
        );


        databaseDot.classList.add(
            "offline"
        );

    }

}


/* ==========================================
   START APPLICATION
========================================== */

loadProducts();

checkHealth();

updateCart();
