# Inventory.oc - Inventory Management System

A modern, offline-first inventory management system built with React and Vite. All data and accounts are stored locally in the browser using IndexedDB — no cloud backend required.

## Features

- **Local Authentication**: Sign up and log in with accounts stored on this device
- **First User = Admin**: The first account created on a device gets full admin access
- **Dashboard**: Home page with stock numbers, top categories, and orders
- **Product Management**: Add, view, and manage products with stock tracking
- **Category Management**: Organize products by categories
- **Staff Management**: Manage staff members with roles
- **Customer Management**: Track customers with approval workflow
- **Settings**: User profile and install-as-app options
- **Progressive Web App (PWA)**: Installable on desktop and mobile
- **Offline Support**: Works without internet after initial load (use production build)

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone <repository-url>
cd Inventory.co
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

> **Note:** Offline mode requires a production build. `npm run dev` needs the Vite dev server and does not work offline.

### Build & Preview (for offline/PWA testing)

```bash
npm run build
npm run preview
```

Open `http://localhost:4173`, load the app once while online, then you can use it offline.

## Project Structure

```
Inventory.co/
├── src/
│   ├── components/          # React components
│   ├── contexts/            # Auth context
│   ├── hooks/               # PWA install hook
│   ├── services/
│   │   ├── localDatabase.js # IndexedDB layer
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── staffService.js
│   │   ├── customerService.js
│   │   └── orderService.js
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── icons/               # PWA icons
│   └── manifest.json
└── vite.config.js           # Vite + PWA plugin
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **vite-plugin-pwa** - Service worker and offline caching
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **IndexedDB** - Local database (via `localDatabase.js`)

## Data Storage

| Topic | Detail |
|-------|--------|
| **Where data lives** | Browser IndexedDB on this device |
| **Sync** | No cloud sync between devices |
| **Admin setup** | Create the first account on each device |
| **Clearing browser data** | Deletes all inventory data |

## Security

- Passwords hashed with SHA-256 + salt (Web Crypto API)
- Role-based access control (Admin, Staff, Customer)
- Session stored in IndexedDB meta store
