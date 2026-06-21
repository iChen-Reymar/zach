# ZCH Footwear Shop — Input & Data Reference

This file lists every form input in the app and every field stored in the local database.

---

## Where data is stored

| Environment | Location |
|-------------|----------|
| **Browser (PWA)** | IndexedDB → key `inventory_co_sqlite` |
| **Windows app (Electron)** | `%APPDATA%\ZCH Footwear Shop\inventory.db` |

Full path on your PC:

```
C:\Users\Admin\AppData\Roaming\ZCH Footwear Shop\inventory.db
```

In File Explorer this file may show as **inventory** (type: Data Base File) if Windows hides the `.db` extension. That **is** your data — it is one SQLite database file, not separate text files.

Other folders in that directory (`Cache`, `IndexedDB`, `Local Storage`, etc.) are Electron/browser cache — not your inventory records.

Data stays on the device. There is no cloud sync.

### How to read the data (human-readable)

Run from the project folder:

```bash
npm run export:data
```

This creates JSON files in `data-export/`:

| File | Contents |
|------|----------|
| `all-data.json` | Everything in one file |
| `products.json` | All products |
| `categories.json` | All categories |
| `orders.json` | All orders |
| `users.json` | Login accounts (passwords hidden) |
| `_summary.json` | Row counts per table |

---

## Default admin account

| Field | Value |
|-------|-------|
| Email | `zach@gmail.com` |
| Password | `admin123` |
| Role | Admin |

---

## Database tables & fields

### users
Login credentials (passwords are hashed, never stored in plain text).

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique user ID (UUID) |
| email | TEXT | Login email (unique) |
| password_hash | TEXT | SHA-256 hash |
| salt | TEXT | Password salt |
| created_at | TEXT | ISO date string |

### profiles
User display info and role.

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Same as users.id |
| name | TEXT | Full name |
| email | TEXT | Email address |
| role | TEXT | `Admin`, `Staff`, or `Customer` |
| balance | REAL | Account balance (default 0) |
| created_at | TEXT | ISO date string |

### categories

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique category ID |
| name | TEXT | Category name |
| image | TEXT | Image URL or path |
| item_count | INTEGER | Number of products in category |
| created_at | TEXT | ISO date string |

### products

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique product ID |
| name | TEXT | Product name |
| stock | INTEGER | Quantity in stock |
| price | REAL | Unit price |
| status | TEXT | `Active`, `Low stock`, or `Sold` |
| category_id | TEXT | Linked category ID |
| category_name | TEXT | Category name (denormalized) |
| image | TEXT | Image URL or path |
| barcode | TEXT | Barcode number (optional) |
| created_at | TEXT | ISO date string |

### staff

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique staff record ID |
| staff_id | TEXT | Display staff ID |
| name | TEXT | Full name |
| email | TEXT | Email address |
| role | TEXT | `Staff` or `Admin` |
| user_id | TEXT | Linked user account ID |
| created_at | TEXT | ISO date string |

### customers

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique customer record ID |
| customer_id | TEXT | Display customer ID |
| name | TEXT | Full name |
| email | TEXT | Email address |
| role | TEXT | Usually `Customer` |
| user_id | TEXT | Linked user account ID |
| status | TEXT | `pending` or `approved` |
| approved_by | TEXT | Admin who approved |
| approved_at | TEXT | Approval date |
| created_at | TEXT | ISO date string |

### orders

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique order ID |
| customer_id | TEXT | Customer record ID (optional for walk-in sales) |
| product_id | TEXT | Product ID |
| product_name | TEXT | Product name at time of order |
| quantity | INTEGER | Units ordered/sold |
| unit_price | REAL | Final price per unit |
| list_unit_price | REAL | Original list price |
| discount | REAL | Discount amount |
| total_amount | REAL | Final total |
| staff_id | TEXT | Staff who processed sale |
| staff_name | TEXT | Staff name |
| payment_method | TEXT | `cash`, `gcash`, or `credit_card` |
| order_date | TEXT | ISO date string |

### meta
App settings and session.

| Field | Type | Description |
|-------|------|-------------|
| key | TEXT | Setting name |
| value | TEXT | Setting value |

Common keys: `sessionUserId`, `defaultAdminPasswordCustomized`, `legacyMigrated`

---

## Form inputs by screen

### Login (`Login.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Email | email | Yes | |
| Password | password | Yes | |

### Sign up (`Signup.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Name | name | Yes | |
| Email | email | Yes | |
| Password | password | Yes | First user becomes Admin |

### Add / Edit Category (`AddCategoryModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Category name | name | Yes | |
| Category image | image | No | Upload or pick existing |

### Add / Edit Product (`AddProductModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Product name | name | Yes | |
| Stock | stock | Yes | Integer |
| Price | price | No | Defaults to 0 |
| Category | category | Yes | Dropdown from categories |
| Product image | image | No | Uses category image if empty |
| Barcode | barcode | No | Can scan with camera |

### Add / Edit Staff (`AddStaffModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Search email/name | searchTerm | No | Finds existing user account |
| Name | name | Yes | |
| Email | email | Yes | |
| Role | role | Yes | `Staff` or `Admin` |

### Add Customer (`AddCustomerModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Search email | searchEmail | No | Finds existing account |
| Name | name | Yes | |
| Email | email | Yes | |
| Role | role | Yes | Default: `Customer` |

### Record Sale — Admin/Staff (`SaleModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Product search | productSearch | Yes | Search by name, category, barcode, stock |
| Quantity | quantity | Yes | Default: 1 |
| Sale unit price | saleUnitPrice | No | Defaults to list price |
| Discount | discountAmount | No | Cannot exceed list total |
| Payment method | paymentMethod | Yes | `cash`, `gcash`, `credit_card` |

### Place Order — Customer (`OrderModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Product | selectedProduct | Yes | Dropdown |
| Quantity | quantity | Yes | Default: 1 |
| Payment method | paymentMethod | Yes | `gcash` or `credit_card` |
| GCash number | gcashNumber | If GCash | Min 10 digits |
| Card number | cardNumber | If card | Min 16 digits |
| Cardholder name | cardName | If card | |
| Expiry | cardExpiry | If card | MM/YY |
| CVV | cardCvv | If card | Min 3 digits |

### Cash In — Customer balance (`CashInModal.jsx`)

| Input | Field name | Required | Notes |
|-------|------------|----------|-------|
| Amount | amount | Yes | Must be > 0 |
| Payment method | paymentMethod | Yes | `gcash` or `credit_card` |
| GCash number | gcashNumber | If GCash | Min 10 digits |
| Card number | cardNumber | If card | Min 16 digits |
| Cardholder name | cardName | If card | |
| Expiry | cardExpiry | If card | |
| CVV | cardCvv | If card | Min 3 digits |

### Settings (`Settings.jsx`)

**Profile (read-only display)**

| Field | Source |
|-------|--------|
| Name | profile.name |
| Email | profile.email |
| Role | profile.role |

**Change own password**

| Input | Field name | Required |
|-------|------------|----------|
| Current password | currentPassword | Yes |
| New password | newPassword | Yes |
| Confirm password | confirmPassword | Yes |

**Admin: set staff password**

| Input | Field name | Required |
|-------|------------|----------|
| Staff member | staffId | Yes |
| New password | newPassword | Yes |
| Confirm password | confirmPassword | Yes |

---

## Roles & permissions

| Role | Can do |
|------|--------|
| **Admin** | Full access: products, categories, staff, customers, sales, reports, settings |
| **Staff** | Products, sales, limited management |
| **Customer** | View products, place orders, cash in, view own orders (after approval) |

---

## Product status rules

| Stock level | Status |
|-------------|--------|
| > 2 | Active |
| 1–2 | Low stock |
| 0 | Sold |

---

## Payment methods

| Value | Used in |
|-------|---------|
| `cash` | Sale modal (walk-in sales) |
| `gcash` | Orders, cash-in, sales |
| `credit_card` | Orders, cash-in, sales |

---

## Example data shapes (JSON)

### Product
```json
{
  "id": "uuid",
  "name": "Nike Air Max",
  "stock": 10,
  "price": 3500,
  "status": "Active",
  "category_id": "uuid",
  "category_name": "Sneakers",
  "image": "/icons/...",
  "barcode": "1234567890123",
  "created_at": "2026-06-18T00:00:00.000Z"
}
```

### Order (sale)
```json
{
  "id": "uuid",
  "customer_id": null,
  "product_id": "uuid",
  "product_name": "Nike Air Max",
  "quantity": 2,
  "unit_price": 3500,
  "list_unit_price": 3500,
  "discount": 0,
  "total_amount": 7000,
  "staff_id": "uuid",
  "staff_name": "John Staff",
  "payment_method": "cash",
  "order_date": "2026-06-18T00:00:00.000Z"
}
```

### Customer
```json
{
  "id": "uuid",
  "customer_id": "CUST-001",
  "name": "Jane Customer",
  "email": "jane@example.com",
  "role": "Customer",
  "user_id": "uuid",
  "status": "approved",
  "approved_by": "admin-uuid",
  "approved_at": "2026-06-18T00:00:00.000Z",
  "created_at": "2026-06-18T00:00:00.000Z"
}
```

---

## Source files

| What | File |
|------|------|
| Database schema | `src/services/localDatabase.js` |
| Auth | `src/services/authService.js` |
| Products | `src/services/productService.js` |
| Categories | `src/services/categoryService.js` |
| Staff | `src/services/staffService.js` |
| Customers | `src/services/customerService.js` |
| Orders | `src/services/orderService.js` |
