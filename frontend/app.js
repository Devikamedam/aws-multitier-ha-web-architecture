
const productContainer = document.getElementById("product-container");
const apiBadge = document.getElementById("api-badge");

const backendStatus = document.getElementById("backend-status");
const databaseStatus = document.getElementById("database-status");

const backendDot = document.getElementById("backend-dot");
const databaseDot = document.getElementById("database-dot");

const cartCount = document.getElementById("cart-count");

let cart = 0;


/*
    Temporary fallback data.

    Once the Flask API and RDS database are connected,
    products will be retrieved from /api/products.
*/

const fallbackProducts = [
    {
        id: 1,
        name: "CloudBook Pro",
        category: "Computers",
        description: "Powerful laptop designed for cloud engineers and developers.",
        price: 899,
        icon: "💻"
    },

    {
        id: 2,
        name: "CloudSound",
        category: "Audio",
        description: "Wireless headphones with immersive sound and all-day comfort.",
        price: 99,
        icon: "🎧"
    },

    {
        id: 3,
        name: "CloudWatch Fit",
        category: "Wearables",
        description: "Smart watch for activity tracking, notifications and productivity.",
        price: 199,
        icon: "⌚"
    }
];


function displayProducts(products) {

    productContainer.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("article");

        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">
                ${product.icon || "📦"}
            </div>

            <div class="product-content">

                <span class="product-category">
                    ${product.category || "Product"}
                </span>

                <h3>${product.name}</h3>

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

        const button = card.querySelector(".add-button");

        button.addEventListener("click", () => {
            cart++;
            cartCount.textContent = cart;

            button.textContent = "Added ✓";

            setTimeout(() => {
                button.textContent = "Add to Cart";
            }, 900);
        });

        productContainer.appendChild(card);
    });
}


async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("API unavailable");
        }

        const products = await response.json();

        displayProducts(products);

        apiBadge.textContent = "● API Connected";
        apiBadge.className = "api-badge online";

    } catch (error) {

        /*
            Backend has not been deployed yet.
            Display demo products so the frontend
            can still be tested locally.
        */

        displayProducts(fallbackProducts);

        apiBadge.textContent = "● Demo Mode";
        apiBadge.className = "api-badge checking";
    }
}


async function checkHealth() {

    try {

        const response = await fetch("/api/health");

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        const data = await response.json();

        backendStatus.textContent =
            data.api || "Connected";

        backendDot.classList.add("online");

        if (data.database === "connected") {

            databaseStatus.textContent =
                "Connected to Amazon RDS";

            databaseDot.classList.add("online");

        } else {

            databaseStatus.textContent =
                "Database connection unavailable";

            databaseDot.classList.add("offline");
        }

    } catch (error) {

        backendStatus.textContent =
            "Backend not connected - local demo mode";

        databaseStatus.textContent =
            "RDS connection will be configured during deployment";

        backendDot.classList.add("offline");
        databaseDot.classList.add("offline");
    }
}


loadProducts();
checkHealth();
