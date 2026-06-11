# UrbanCart — Full Stack Fashion E-Commerce Web Application

UrbanCart is a production-style, responsive, full-stack e-commerce web application featuring a minimal, luxury-inspired fashion store design. 

This repository implements a loosely coupled Model-View-Controller (MVC) architecture on the backend coupled with a component-driven React.js single-page application on the frontend. It runs against a normalized MySQL relational database.

---

## 🤎 Core Design System & Theme
- **Style Concept**: Editorial Luxury, Minimalist, Classy Vogue-inspired spacing and typography.
- **Primary Color**: Dark Coffee Brown (`#4B3832`)
- **Secondary Color**: Warm Brown (`#7B5E57`)
- **Accent/CTA**: Espresso Brown (`#5C4033`)
- **Backgrounds**: Soft White (`#F8F6F3`) and Card White (`#FFFFFF`)
- **Typography**: Times New Roman

---

## 📁 Key Directories & File Structure

```
urbancart/
├── backend/
│   ├── config/              # DB connection pooling
│   │   └── db.js
│   ├── controllers/         # MVC Controllers (Auth, Product, Cart, Order, Admin)
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── database/            # DDL Schemas & Seeds
│   │   ├── init-db.js
│   │   └── schema.sql
│   ├── middleware/          # JWT Verification & Role Authorization
│   │   └── authMiddleware.js
│   ├── routes/              # Express API Routes
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   └── productRoutes.js
│   ├── server.js            # Entry Point
│   ├── .env                 # Environment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI (Navbar, Footer, ProductCard, ProtectedRoutes)
│   │   ├── context/         # React Context State (Auth, Cart, Toast)
│   │   ├── pages/           # Page Layouts (Home, Shop, Details, Cart, Checkout, Orders, Admin)
│   │   ├── services/        # Axios API Client Interceptor
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── index.css        # Luxury Vanilla CSS tokens & layouts
│   │   ├── App.jsx          # Routing & Nesting Providers
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🛢️ Normalized MySQL Database Schema

1. **`users`**: Customer and admin account details. Hashed passwords.
2. **`products`**: Fashion items catalog details with descriptions, stock, and Image URL links.
3. **`cart`**: Temp cart items mapped to specific users.
4. **`orders`**: Placed orders totaling cart costs with status tracking.
5. **`order_items`**: Line items of checkout orders.

### State Integrity & Stock Deductions
- **Ordering**: Automatically verifies stock counts. Places the order, creates line items, and deducts product stock inside a **SQL Transaction** (automatic rollback if any step fails).
- **Cancellation**: Cancelling an order (regular user on pending order, or admin at any point) immediately restores stock counts for all associated order items.

---

## 🔑 Demo Account Credentials

To login and test roles:
* **Admin Role**: `admin@urbancart.com` / Password: `admin123`
* **Customer Role**: `customer@urbancart.com` / Password: `user123`

---

## 🚀 Running the Project Locally

### 1. Backend Setup
1. Open a terminal in `/backend`.
2. Configure the `.env` file (the database u597277762_urbancart is already running in Hostinger cloud, so the seeded credentials in `.env` are ready to use!).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server (runs on port `5000`):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a terminal in `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server (runs on port `5173`):
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.
