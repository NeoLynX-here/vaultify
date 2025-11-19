

# 🔐 VAULTIFY

###  Encrypted Password Manager

Includes: **User App + Admin Dashboard + Express Backend + PostgreSQL**

---

## 🚀 Overview

Vaultify is a fully self-hosted, end-to-end encrypted password manager.
All sensitive vault/card data is encrypted **client-side** using AES-256 before reaching the server.

This repo contains **three apps**:

| Folder              | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| **backend/**        | Express + PostgreSQL API (auth, vault, cards, 2FA, premium) |
| **vaultify/**       | Main user-facing Password Manager (React + Vite)            |
| **vaultify-admin/** | Admin dashboard to manage users, premium keys, 2FA resets   |
| **backend-admin/**  | Express + PostgreSQL API (user management) |

---

## 🧱 Features

### 🔒 **User App (Vaultify)**

* AES-256 vault encryption (client-side)
* Card storage encryption
* PBKDF2 password hashing
* Auto-save vault and cards
* 2FA (TOTP) support
* Premium unlock with key
* Dark cyberpunk UI

### 🛠️ **Admin Panel**

* Login with admin credentials
* View all users
* Toggle premium on/off
* Regenerate premium keys
* Reset user 2FA
* Cyberpunk UI

### 🧬 **Backend**

* Express.js REST API
* JWT authentication
* Secure TOTP verification
* 2FA ticket-based login
* PostgreSQL database
* Premium key generation
* Salted password hashing

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```sh
git clone https://github.com/NeoLynX-here/vaultify.git
cd vaultify
```

### 2️⃣ Install Dependencies

#### Backend:

```sh
cd backend
npm install
```

#### User App:

```sh
cd ../vaultify
npm install
```

#### Admin App:

```sh
cd ../vaultify-admin
npm install
```

#### Admin Backend:

```sh
cd ../backend-admin
npm install
```

---

## 🗄️ Database Setup (PostgreSQL)

1. Create a PostgreSQL database:

```sql
CREATE DATABASE vaultify;
```

2. Run the schema file:

```sh
psql -U postgres -d vaultify -f vault.sql
```

Your final schema includes:

* users
* twofa_tickets

---

## 🔑 Environment Variables


```
DB_USER=vaultuser
DB_PASS=vaultpass
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaultify

JWT_SECRET=supersecretjwt
ADMIN_USER=admin
ADMIN_PASS=admin123
```

---

## ▶️ Running the project

### Start backend:

```sh
cd backend
node main.js
```

### Start backend-admin:

```sh
cd backend-admin
node main.js
```

### Start user Vaultify app:

```sh
cd vaultify
npm run dev
```

### Start admin dashboard:

```sh
cd vaultify-admin
npm run dev
```

---

## 📦 Production Build

User App:

```sh
cd vaultify
npm run build
```

Admin App:

```sh
cd vaultify-admin
npm run build
```

---

## 🛡 Security Notes

* Vault keys never leave the browser.
* Backend cannot decrypt user vaults.
* TOTP secrets stored server-side *only after user activation*.
* Premium keys regenerated securely with random hex generator.

---

## 📜 License

MIT License – feel free to modify and use.

---

## 💬 Contact

For issues or improvements → open an Issue on GitHub.
