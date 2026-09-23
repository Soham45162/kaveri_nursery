# Kaveri Nursery Management System

A complete modern, responsive, professional nursery management website built for "Kaveri Nursery". It features a premium nature-inspired design, dynamic data-driven public pages, and a secure Admin Dashboard for managing inventory and operations.

## Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS, Framer Motion (animations), Lucide React (icons), React Router (navigation)
*   **Frontend:** React (Vite), Tailwind CSS, Framer Motion (animations), Lucide React (icons), React Router (navigation)
*   **Backend Server:** Node.js, Express, Multer, JWT, BcryptJS
*   **Database & Media Storage:** PostgreSQL 18 (`pg` pool, binary `BYTEA` image storage, UUID PKs, foreign keys, constraints)

## Key Features

### 1. Public Website
*   **Modern Design:** Green, earthy, fresh colors with glassmorphism and subtle scrolling animations.
*   **Dynamic Plant Store:** Live inventory of plants served via PostgreSQL API and streamed BYTEA images.
*   **Past Projects Gallery:** Showcases landscaping and garden design work with multi-image carousels and plant tags.
*   **Customer Reviews:** Visitors can submit reviews and photos (moderated via Admin review approval).

### 2. Admin Dashboard (Protected via JWT)
*   **Authentication:** Secure bcrypt password verification with JWT token authorization (Admin & Customer roles).
*   **Inventory Management:** Add, update, and delete plant records with BYTEA binary image uploads and stock management.
*   **Project Management:** Manage landscaping gallery projects with before/after photos and linked plants.
*   **Review Management:** Approve or delete user-submitted reviews and review photos.
*   **Billing & Invoicing System:** Generate, save, print, and download professional GST invoices/quotations with custom letterhead headers.
*   **Labour Register & Ledger:** Complete worker directory, wage rates, daily attendance tracking, wage history, salary payments, and cash advance records.

## Local Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Soham45162/kaveri_nursery.git
    cd kaveri_nursery
    ```

2.  **Database Setup (PostgreSQL 18):**
    Ensure PostgreSQL 18 is running and create database `kaveri_nursery`:
    ```bash
    cd server
    npm install
    # Apply schema and initial admin seed
    npm run migrate
    npm run seed
    ```

3.  **Start the Backend API Server:**
    ```bash
    cd server
    npm run dev
    # Backend runs on http://localhost:5000
    ```

4.  **Start the Frontend Client:**
    ```bash
    cd client
    npm install
    npm run dev
    # Frontend runs on http://localhost:5173
    ```
    ```

## Deployment

The project is configured for seamless deployment on Netlify.
Ensure that the **Build Command** is set to `npm run build` and the **Publish Directory** is set to `dist`. You must also add the `VITE_FIREBASE_*` environment variables in your Netlify site settings.