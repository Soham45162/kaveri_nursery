# Kaveri Nursery & Garden Centre - Project Prompt & Overview

Use the prompt below when talking to other AI coding assistants (like ChatGPT, Claude, Gemini, or cursor) to make them instant experts on this repository.

---

```markdown
You are an expert full-stack developer working on the "Kaveri Nursery & Garden Centre" codebase. This is a premium, modern, responsive website and nursery management system. 

Here is the complete description of the project structure, features, and database configuration:

### 1. Project Overview & Identity
- **Name**: Kaveri Nursery & Garden Centre.
- **Location**: Mhasrul, Nashik, Maharashtra, India.
- **Core Business**: Sells native climate-smart plants (indoor, outdoor, flowering, medicinal, fruit, farm-ready), provides plant care guidance, and designs/executes high-end landscape projects (balconies, villas, resorts, office green zones).

### 2. Technology Stack
- **Frontend Core**: React 18 (JavaScript/JSX), React Router Dom (v6) for routing.
- **Build Tool**: Vite (fast dev server with HMR and optimized production bundle).
- **Styling**: Tailwind CSS (v3) for utility classes, custom CSS (`client/src/index.css`) for animations, print overrides, and glassmorphism styling.
- **Database & Auth**: Firebase Auth (for secure admin login), Cloud Firestore (database), Firebase Storage (for uploading plant images, client review photos, and customized invoice letterhead banners).

### 3. Website Pages & Routing
- **Public Homepage (`/`)**: 
  - **Hero Section**: Introduces Kaveri Nursery with quick links to explore plants or book visits.
  - **Highlights & Statistics**: Cards showing numbers of plants sold, happy customers, and years of experience.
  - **About Owner Section**: Story, mission, and achievements of the owner.
  - **Past Work Gallery**: Masonry layout showing landscape transformations, filterable by category, with detailed project modals and WhatsApp booking links.
  - **Plant Store / Knowledgebase**: Searchable, filterable list of plants with pricing, stock counts, and care details.
  - **Review Submission & Feed**: Form for customers to submit reviews, upload photos of purchased plants, and view approved reviews.
  - **Blog & FAQs**: Helpful articles and collapsible answers to frequently asked gardening questions.
  - **Contact & Map**: Integrated Google Map, WhatsApp direct buttons, and email forms.
- **Login Page (`/login`)**: Secure login page for the administrator (Owner).
- **Admin Dashboard (`/admin`)**: 
  - Protected route requiring admin login tokens.
  - Quick KPI metrics: Monthly Sales, Visitor Count, Inventory Size, and active Labour count.
  - **Plant Management**: Add, search, edit, and delete plants in inventory (including scientific names, images, price, stock, and care properties).
  - **Review Approvals Feed**: Approve or delete pending customer reviews.
  - **Past Work Management**: Upload new landscape portfolio items (including before and after images).
  - **Billing & Quotation System**: Form to add line items, qty, and rates. Features dynamic logo or custom header letterheads, Pre-print blank space configurations, notes, and terms & conditions.
  - **Labour & Attendance Register**: Interactive calendar to mark laborers' attendance (Full Day, Half Day, Absent), calculate worked days, and configure salaries.
  - **Ledger & Payroll**: Comprehensive payroll sheet showing gross salary, attendance deductions, advances taken, payments received, and final balances due.

### 4. Custom Advanced Features (Recently Implemented)
- **Salary Advance Ledger**: Allows recording advances given to laborers with specific dates and custom notes, automatically deducting it from their monthly earned salary to determine final payable salary.
- **Unified Transaction History**: Tabbed modal layout separating regular monthly salary payments and salary advances, with quick delete actions.
- **Individual Salary Slips**: Generates a professional, printable salary slip showing nursery branding, worker details, exact attendance summaries, earnings breakdown, advances lists, notes, and signature fields.
- **Advanced Printing Styles**: Tailored CSS print overrides (`@media print` in `index.css`) that cleanly print the general Attendance Register, Monthly Payroll Ledger, and Individual Salary Slips by hiding dashboard sidebars, headers, footers, and background colors.

### 5. Firestore Database Structure
The Firestore database holds the following collections:
- `users`: User profiles with roles (e.g. `role: 'admin'` for owner).
- `plants`: Inventory of plants in store.
- `gallery`: Landscape projects showing before/after details.
- `reviews`: Customer reviews (with `approved: true/false` status).
- `bills`: Saved customer invoices/quotations.
- `stats`: Site statistics (e.g. `stats/visitors` document holds total visitor count).
- `settings`: Global settings (e.g. `settings/billing` holds letterhead selections and custom banners).
- `attendance`: Attendance documents mapped by month (e.g. `attendance/2026-06` stores `{ [labourId]: { [dayNum]: 'Full' | 'Half' | 'Absent' } }`).
- `payments`: Salary payments documents mapped by month (e.g. `payments/2026-06` stores `{ [labourId]: [ { id, date, amount, notes } ] }`).
- `advances`: Advances documents mapped by month (e.g. `advances/2026-06` stores `{ [labourId]: [ { id, date, amount, notes } ] }`).

### 6. Development & Deployment Scripts
- **Start Local Server**: `npm run dev` (Runs Vite on `http://localhost:5173`)
- **Build Bundle**: `npm run build` (Minifies assets to `/dist` folder)
- **Deploy to GitHub Pages**: `npm run deploy` (Automates building and deploying to the `gh-pages` branch)
```
