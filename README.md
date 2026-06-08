# 🏠 Home Lift

Home Lift is a premium, modern web application that bridges the gap between everyday users and skilled service providers (cleaners, electricians, plumbers, etc.). The platform manages the entire lifecycle of a service request: from seamless discovery, booking, and real-time chat, to secure payments and provider earnings tracking.

Built with an enterprise-ready architecture using **React + Redux Toolkit** on the frontend and **Django REST Framework** + **WebSockets (Django Channels)** on the backend.

---

## 🚀 Key Features

### Authentication & Security
- **Atomic Registration Flow**: Strict server-side OTP validation tied directly to user creation.
- **Social Login**: Integrated Google OAuth.
- **Role-Based Access Control**: Distinct dashboards and access limits for Users, Providers, and Administrators.
- **Aggressive Data Validation**: Real-time keystroke filtering to prevent invalid characters (spaces, special symbols) in critical fields.
- **Password Strength UI**: Dynamic, real-time visual feedback for password strength and rules validation.

### User & Provider Workflows
- **Service Discovery**: Browse dynamically categorized services with pricing and experience details.
- **Provider Application System**: Users can upload identity documents and apply for provider status, subject to Admin approval.
- **Booking Management**: Book services, track statuses, and view complete history.
- **Dynamic Dashboards**: Responsive, distinct layouts with collapsable sidebars for Admin, Provider, and User modes.

### Real-Time Interactions
- **Live Chat**: Instant messaging between Users and Providers powered by WebSockets (Django Channels + Redis).
- **Live Notifications**: Real-time broadcast alerts for booking updates, chat messages, and administrative actions.

### Financial & Promotional Systems
- **Stripe Integration**: Secure payment processing with automated backend Webhook handling.
- **Wallet System**: Earnings tracking for providers with withdrawal request capabilities.
- **Promo Codes**: Strict validation of coupon codes dynamically bound by service prices.

### Core Architecture & Operations
- **Enterprise Logging**: Fully configured rotating file loggers (`homelift.log`) tracking system events, exceptions, and analytics.
- **Image Handling**: Cloudinary integration for scalable profile and document image storage, equipped with robust Django signals to ensure safe updates and prevent accidental file deletions.
- **Caching**: Redis-backed cache for OTPs and rapid state retrieval.
- **Advanced Search**: High-performance backend-driven search functionality dynamically integrated with the UI.
- **Document Viewing**: Secure proxy viewing system for identity documents and certificates.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js
- **State Management**: Redux Toolkit (Thunks for async operations)
- **Routing**: React Router DOM
- **UI & Styling**: Material UI (MUI), Framer Motion (for micro-animations)
- **Forms**: React Hook Form
- **Network**: Axios (with custom auth interceptors)

### Backend
- **Framework**: Django & Django REST Framework
- **Asynchronous Protocol**: ASGI (Daphne), WebSockets (Django Channels)
- **Database**: PostgreSQL
- **Cache / Message Broker**: Redis
- **Media Storage**: Cloudinary
- **Payments**: Stripe SDK
- **Security**: Simple JWT (JSON Web Tokens)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- PostgreSQL
- Redis Server (running on `localhost:6379`)
- Stripe API Keys
- Cloudinary Credentials
- Google Client ID

### Backend Setup
```bash
cd back/HomeLift
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create a .env file and add your credentials (DB, Stripe, Cloudinary, Email, etc.)
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install

# Create a .env file with VITE_API_URL and VITE_GOOGLE_CLIENT_ID
npm run dev
```

---

## 🛡️ Best Practices Implemented
- **Security**: Cookies are ready for `Secure` and `SameSite` restrictions via `.env` flags.
- **Error Handling**: Global try/catch blocks handling frontend fallbacks, alongside robust Django exception handling preventing server crashes.
- **Responsive Design**: Mobile-first architecture with customized navigation drawers and responsive tables.
