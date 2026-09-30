/* =========================================================
   DEVI STORE - FRONTEND APPLICATION
   ========================================================= */

/* ================= DOM ELEMENTS ================= */

const loginButton = document.getElementById("login-button");
const accountMenu = document.getElementById("account-menu");
const logoutButton = document.getElementById("logout-button");

const authModal = document.getElementById("auth-modal");
const authClose = document.getElementById("auth-close");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignup = document.getElementById("show-signup");
const showLogin = document.getElementById("show-login");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");

const productContainer = document.getElementById("product-container");

const apiBadge = document.getElementById("api-badge");
const backendStatus = document.getElementById("backend-status");
const databaseStatus = document.getElementById("database-status");
const backendDot = document.getElementById("backend-dot");
const databaseDot = document.getElementById("database-dot");

const cartCount = document.getElementById("cart-count");
const cartButton = document.getElementById("cart-button");
const cartModal = document.getElementById("cart-modal");
const closeCart = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartTax = document.getElementById("cart-tax");
const cartTotal = document.getElementById("cart-total");

const checkoutButton = document.getElementById("checkout-button");
const checkoutModal = document.getElementById("checkout-modal");
const closeCheckout = document.getElementById("close-checkout");
const customerForm = document.getElementById("customer-form");
const checkoutTotal = document.getElementById("checkout-total");

const otpModal = document.getElementById("otp-modal");
const otpForm = document.getElementById("otp-form");
const otpCode = document.getElementById("otp-code");
const otpClose = document.getElementById("otp-close");
const otpEmailDisplay = document.getElementById("otp-email-display");

const checkoutStep1 = document.getElementById("checkout-step-1");
const checkoutStep2 = document.getElementById("checkout-step-2");
const checkoutStep3 = document.getElementById("checkout-step-3");

const paymentTotal = document.getElementById("payment-total");
const demoPaymentButton = document.getElementById("demo-payment-button");
const backToShipping = document.getElementById("back-to-shipping");

const confirmationOrderId = document.getElementById("confirmation-order-id");

const confirmationTotal = document.getElementById("confirmation-total");

const continueShopping = document.getElementById("continue-shopping");

/* ================= APPLICATION STATE ================= */

let pendingVerificationEmail = "";
let cart = [];
let isLoggedIn = false;
let currentUser = null;
let pendingProduct = null;
let signupRequestInProgress = false;
let checkoutCustomer = null;

/* ================= FALLBACK PRODUCTS ================= */

const fallbackProducts = [
  {
    id: 1,
    name: "Laptop",
    category: "Computers",
    description: "Powerful laptop for work, development and everyday use.",
    price: 899,
    icon: "\u{1F4BB}",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    category: "Audio",
    description: "Comfortable wireless headphones with high-quality sound.",
    price: 99,
    icon: "\u{1F3A7}",
  },
  {
    id: 3,
    name: "Smart Watch",
    category: "Wearables",
    description: "Track activities, notifications and stay connected.",
    price: 199,
    icon: "\u231A",
  },
];

/* =========================================================
   PRODUCTS
   ========================================================= */

function displayProducts(products) {
  productContainer.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
            <div class="product-image">
                ${product.icon || "\u{1F4E6}"}
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
      if (!isLoggedIn) {
        pendingProduct = product;

        openLoginModal();

        return;
      }

      addToCart(product);

      button.textContent = "Added ?";

      setTimeout(() => {
        button.textContent = "Add to Cart";
      }, 900);
    });

    productContainer.appendChild(card);
  });
}

/* ================= LOAD PRODUCTS ================= */

async function loadProducts() {
  try {
    const response = await fetch("/api/products", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Product API unavailable");
    }

    const products = await response.json();

    displayProducts(products);

    apiBadge.textContent = "\u2705 API Connected";
    apiBadge.className = "api-badge online";
  } catch (error) {
    console.error("Product API error:", error);

    displayProducts(fallbackProducts);

    apiBadge.textContent = "\u26A0\uFE0F Demo Mode";
    apiBadge.className = "api-badge checking";
  }
}

/* =========================================================
   CART
   ========================================================= */

function addToCart(product) {
  cart.push(product);

  updateCart();
}

function updateCart() {
  cartCount.textContent = cart.length;

  if (cart.length === 0) {
    cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

    cartSubtotal.textContent = "$0.00";
    cartTax.textContent = "$0.00";
    cartTotal.textContent = "$0.00";

    return;
  }

  cartItems.innerHTML = "";

  let subtotal = 0;

  cart.forEach((product) => {
    subtotal += Number(product.price);

    const item = document.createElement("div");

    item.className = "cart-item";

    item.innerHTML = `
            <div class="cart-item-info">
                <strong>
                    ${product.icon || "\u{1F4E6}"}
                    ${product.name}
                </strong>
            </div>

            <span class="cart-item-price">
                $${Number(product.price).toFixed(2)}
            </span>
        `;

    cartItems.appendChild(item);
  });

  const taxRate = 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

  cartTax.textContent = `$${tax.toFixed(2)}`;

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

/* ================= OPEN CART ================= */

cartButton.addEventListener("click", () => {
  if (!isLoggedIn) {
    openLoginModal();

    return;
  }

  cartModal.classList.add("show");
});

closeCart.addEventListener("click", () => {
  cartModal.classList.remove("show");
});

cartModal.addEventListener("click", (event) => {
  if (event.target === cartModal) {
    cartModal.classList.remove("show");
  }
});

/* =========================================================
   LOGIN / SIGNUP MODAL
   ========================================================= */

function openLoginModal() {
  /*
       Reset any inline display value that may have been
       applied while moving from signup to OTP.
    */
  authModal.style.display = "";

  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  authTitle.textContent = "Welcome Back";

  authSubtitle.textContent = "Login to continue to Devi Store.";

  authModal.classList.add("show");
}

/* ================= LOGIN / ACCOUNT BUTTON ================= */

loginButton.addEventListener("click", () => {
  if (!isLoggedIn) {
    openLoginModal();

    return;
  }

  accountMenu.classList.toggle("show");
});

/* ================= CLOSE AUTH ================= */

authClose.addEventListener("click", () => {
  authModal.classList.remove("show");
});

authModal.addEventListener("click", (event) => {
  if (event.target === authModal) {
    authModal.classList.remove("show");
  }
});

/* ================= SHOW SIGNUP ================= */

showSignup.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");

  authTitle.textContent = "Create Your Account";

  authSubtitle.textContent = "Sign up to continue with Devi Store.";
});

/* ================= SHOW LOGIN ================= */

showLogin.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");

  authTitle.textContent = "Welcome Back";

  authSubtitle.textContent = "Login to continue to Devi Store.";
});

/* =========================================================
   SIGN UP
   ========================================================= */

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (signupRequestInProgress) {
    return;
  }

  const name = document.getElementById("signup-name").value.trim();

  const email = document.getElementById("signup-email").value.trim();

  const password = document.getElementById("signup-password").value;

  const confirmPassword = document.getElementById(
    "signup-confirm-password",
  ).value;

  if (!name || !email || !password || !confirmPassword) {
    alert("Please complete all fields.");

    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");

    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters.");

    return;
  }

  signupRequestInProgress = true;

  const submitButton = signupForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;

    submitButton.textContent = "Creating Account...";
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to create account.");

      return;
    }

    /*
               Save email so OTP knows which
               account is being verified.
            */

    pendingVerificationEmail = email;

    signupForm.reset();

    /*
               IMPORTANT FIX:
               Completely close auth modal BEFORE
               opening OTP.
            */

    // Keep the Sign-Up modal open underneath the OTP modal.
    // Do NOT hide or close authModal here.

    otpEmailDisplay.textContent = email;

    otpCode.value = "";

    otpModal.classList.add("show");

    setTimeout(() => {
      otpCode.focus();
    }, 100);
  } catch (error) {
    console.error("Registration error:", error);

    alert("Unable to connect to the server.");
  } finally {
    signupRequestInProgress = false;

    if (submitButton) {
      submitButton.disabled = false;

      submitButton.textContent = "Create Account";
    }
  }
});

/* =========================================================
   OTP VERIFICATION
   ========================================================= */

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const otp = otpCode.value.trim();

  if (!pendingVerificationEmail) {
    alert("Verification email is missing. Please sign up again.");

    otpModal.classList.remove("show");

    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Please enter a valid 6-digit verification code.");

    return;
  }

  try {
    const response = await fetch("/api/verify-otp", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: pendingVerificationEmail,

        otp: otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to verify email.");

      return;
    }

    const verifiedEmail = pendingVerificationEmail;

    pendingVerificationEmail = "";

    otpForm.reset();

    /*
               Close OTP
            */

    otpModal.classList.remove("show");

    alert("Email verified successfully! Please log in.");

    /*
               Restore auth modal after we previously
               set display:none during signup.
            */

    authModal.style.display = "";

    /*
               Show LOGIN only
            */

    signupForm.classList.add("hidden");

    loginForm.classList.remove("hidden");

    authTitle.textContent = "Welcome Back";

    authSubtitle.textContent = "Your email is verified. Please log in.";

    /*
               Put verified email into login form
            */

    const loginEmail = document.getElementById("login-email");

    loginEmail.value = verifiedEmail;

    /*
               Open Login modal
            */

    authModal.classList.add("show");

    setTimeout(() => {
      document.getElementById("login-password").focus();
    }, 100);
  } catch (error) {
    console.error("OTP verification error:", error);

    alert("Unable to connect to the server.");
  }
});

/* ================= CLOSE OTP ================= */

otpClose.addEventListener("click", () => {
  otpModal.classList.remove("show");
});

otpModal.addEventListener("click", (event) => {
  if (event.target === otpModal) {
    otpModal.classList.remove("show");
  }
});

/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();

  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Please enter email and password.");

    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to login.");

      return;
    }

    isLoggedIn = true;

    currentUser = data.user;

    authModal.classList.remove("show");

    /*
               Reset inline style so Login works
               normally next time.
            */

    authModal.style.display = "";

    accountMenu.classList.remove("show");

    loginButton.textContent = `Hi, ${data.user.name}`;

    loginForm.reset();

    /*
               If user originally clicked Add to Cart
               before logging in, add that product now.
            */

    if (pendingProduct) {
      addToCart(pendingProduct);

      pendingProduct = null;

      cartModal.classList.add("show");
    }
  } catch (error) {
    console.error("Login error:", error);

    alert("Unable to connect to the server.");
  }
});

/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      alert("Unable to logout.");

      return;
    }

    isLoggedIn = false;

    currentUser = null;

    pendingProduct = null;

    pendingVerificationEmail = "";

    cart = [];

    updateCart();

    loginButton.textContent = "Login / Sign Up";

    accountMenu.classList.remove("show");

    cartModal.classList.remove("show");

    checkoutModal.classList.remove("show");

    otpModal.classList.remove("show");

    authModal.classList.remove("show");

    authModal.style.display = "";
  } catch (error) {
    console.error("Logout error:", error);

    alert("Unable to connect to the server.");
  }
});

/* ================= CLOSE ACCOUNT MENU ================= */

document.addEventListener("click", (event) => {
  if (
    isLoggedIn &&
    accountMenu &&
    !accountMenu.contains(event.target) &&
    event.target !== loginButton
  ) {
    accountMenu.classList.remove("show");
  }
});

/* =========================================================
   CHECKOUT
   ========================================================= */

checkoutButton.addEventListener("click", () => {
  if (!isLoggedIn) {
    openLoginModal();

    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");

    return;
  }

  checkoutStep2.classList.add("hidden");

  checkoutStep3.classList.add("hidden");

  checkoutStep1.classList.remove("hidden");

  checkoutTotal.textContent = cartTotal.textContent;

  const customerEmail = document.getElementById("customer-email");

  const customerName = document.getElementById("customer-name");

  if (currentUser && customerEmail) {
    customerEmail.value = currentUser.email;
  }

  if (currentUser && customerName && !customerName.value) {
    customerName.value = currentUser.name;
  }

  cartModal.classList.remove("show");

  checkoutModal.classList.add("show");
});

/* ================= CLOSE CHECKOUT ================= */

closeCheckout.addEventListener("click", () => {
  checkoutModal.classList.remove("show");
});

checkoutModal.addEventListener("click", (event) => {
  if (event.target === checkoutModal) {
    checkoutModal.classList.remove("show");
  }
});

/* =========================================================
   SHIPPING FORM
   ========================================================= */

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  checkoutCustomer = {
    name: document.getElementById("customer-name").value.trim(),

    email: document.getElementById("customer-email").value.trim(),

    address: document.getElementById("customer-address").value.trim(),

    city: document.getElementById("customer-city").value.trim(),

    state: document.getElementById("customer-state").value.trim(),

    zip: document.getElementById("customer-zip").value.trim(),
  };

  paymentTotal.textContent = cartTotal.textContent;

  checkoutStep1.classList.add("hidden");

  checkoutStep2.classList.remove("hidden");
});

/* ================= BACK TO SHIPPING ================= */

backToShipping.addEventListener("click", () => {
  checkoutStep2.classList.add("hidden");

  checkoutStep1.classList.remove("hidden");
});

/* =========================================================
   DEMO PAYMENT + CREATE ORDER
   ========================================================= */

demoPaymentButton.addEventListener("click", async () => {
  if (!checkoutCustomer || cart.length === 0) {
    alert("Checkout information is missing.");

    return;
  }

  demoPaymentButton.disabled = true;

  demoPaymentButton.textContent = "Processing Demo Payment...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        ...checkoutCustomer,

        items: cart.map((product) => ({
          id: product.id,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to create order.");

      return;
    }

    confirmationOrderId.textContent = `#${data.order.id}`;

    confirmationTotal.textContent = `$${Number(data.order.total).toFixed(2)}`;

    checkoutStep2.classList.add("hidden");

    checkoutStep3.classList.remove("hidden");

    cart = [];

    updateCart();
  } catch (error) {
    console.error("Order error:", error);

    alert("Unable to connect to the server.");
  } finally {
    demoPaymentButton.disabled = false;

    demoPaymentButton.textContent = "Complete Demo Payment";
  }
});

/* ================= CONTINUE SHOPPING ================= */

continueShopping.addEventListener("click", () => {
  checkoutModal.classList.remove("show");

  checkoutStep3.classList.add("hidden");

  checkoutStep2.classList.add("hidden");

  checkoutStep1.classList.remove("hidden");

  checkoutCustomer = null;

  customerForm.reset();
});

/* =========================================================
   HEALTH CHECK
   ========================================================= */

async function checkHealth() {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Backend unavailable");
    }

    const data = await response.json();

    backendStatus.textContent = data.api || "Connected";

    backendDot.classList.remove("offline");

    backendDot.classList.add("online");

    if (data.database === "connected") {
      databaseStatus.textContent = "Connected to Database";

      databaseDot.classList.remove("offline");

      databaseDot.classList.add("online");
    } else {
      databaseStatus.textContent = "Database connection unavailable";

      databaseDot.classList.remove("online");

      databaseDot.classList.add("offline");
    }
  } catch (error) {
    console.error("Health check error:", error);

    backendStatus.textContent = "Backend not connected - local demo mode";

    databaseStatus.textContent = "Database connection unavailable";

    backendDot.classList.remove("online");

    backendDot.classList.add("offline");

    databaseDot.classList.remove("online");

    databaseDot.classList.add("offline");
  }
}

/* =========================================================
   CHECK EXISTING LOGIN SESSION
   ========================================================= */

async function checkLoginSession() {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      isLoggedIn = false;

      currentUser = null;

      loginButton.textContent = "Login / Sign Up";

      accountMenu.classList.remove("show");

      return;
    }

    const data = await response.json();

    if (data.authenticated && data.user) {
      isLoggedIn = true;

      currentUser = data.user;

      loginButton.textContent = `Hi, ${data.user.name}`;
    } else {
      isLoggedIn = false;

      currentUser = null;

      loginButton.textContent = "Login / Sign Up";
    }
  } catch (error) {
    console.error("Session check error:", error);

    isLoggedIn = false;

    currentUser = null;

    loginButton.textContent = "Login / Sign Up";
  }
}

/* =========================================================
   START APPLICATION
   ========================================================= */

loadProducts();

checkHealth();

updateCart();

checkLoginSession();
