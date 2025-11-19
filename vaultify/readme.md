# Vaultify – Password & Card Manager (Frontend)

A secure, modern password and card management application with client-side encryption and a cyberpunk-inspired interface.

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

### Security & Encryption
- **🔐 Full client-side encryption** (AES-256-GCM)
- **🔑 Master password never sent to server**
- **🧩 Derives vaultKey using PBKDF2**
- **💳 Secure Card Manager** with separate encryption
- **🔍 Breach Scanner** (HaveIBeenPwned API integration)

### User Experience
- **🧪 Password Generator** with secure algorithms
- **📱 Reactive & cyberpunk UI**
- **🌙 Dark-only theme** optimized for eye comfort
- **🔒 2FA (TOTP) support**
- **🌟 Premium system** with activation key

## 📦 Tech Stack

- **Frontend Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Styling**: TailwindCSS 3.x
- **Routing**: React Router
- **Encryption**: Web Crypto API
- **Backend API**: Node.js + Express

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- Backend server running at `http://localhost:5000`

### Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).


## 🔐 Security Implementation

### Encryption Flow
1. **Master Password**: Never leaves the client
2. **Key Derivation**: PBKDF2 with 100,000+ iterations
3. **Vault Encryption**: AES-256-GCM for password entries
4. **Card Encryption**: Separate keys for payment cards
5. **Local Storage**: Encrypted data only

### Key Features
- Zero-knowledge architecture
- Secure password generation
- Breach detection via HaveIBeenPwned
- Two-factor authentication support

## 🎨 UI/UX Features

- **Cyberpunk aesthetic** with neon accents
- **Fully responsive** design
- **Smooth animations** and transitions
- **Accessibility** compliant
- **Keyboard navigation** support

## 🚀 Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Build output is generated in the `/dist` directory.

## 📚 Scripts

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔌 Backend Integration

The frontend expects a backend API running at `http://localhost:5000` with the following endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register` 
- `GET/POST/ /api/vault`
- `GET/POST/ /api/cards`

## 🛡️ Security Best Practices

- All sensitive operations occur client-side
- No master password transmission
- Secure random number generation
- Regular dependency updates
- Content Security Policy implemented

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This is the frontend component of Vaultify. Ensure the backend server is running for full functionality.
