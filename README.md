# 🏠 Home Lift

A modern web application that connects users with service providers (plumbers, electricians, cleaners, etc.) through an easy-to-use platform.  
Built with **React + Redux (frontend)** and **Django REST Framework (backend)**.

---

## 🚀 Features

- 🔐 OTP-based authentication (email/phone verification)
- 👥 Role-based access (Admin, User, Provider)
- 📋 Service listings with icons
- 🛒 Booking & request management
- 📊 Admin dashboard for user & provider management
- 📱 Responsive, mobile-friendly UI

---

## 🖼️ Screenshots

(Add some screenshots/gifs of your app here — frontend pages, dashboards, etc.)

---

## 🛠️ Tech Stack

**Frontend:**
- React
- Redux Toolkit
- Axios (with interceptors)
- React Router DOM
- Material UI / Tailwind

**Backend:**
- Django
- Django REST Framework
- PostgreSQL
- Redis (for OTP caching)

**Other Tools:**
- Git & GitHub

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- PostgreSQL
- Redis (for OTP)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
