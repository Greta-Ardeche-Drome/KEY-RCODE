# 🔑 KEY-RCODE Mobile App

![Banner](../img/banner.png)

> **A secure, modern mobile application for QR-Code–based electronic access control. Built with Expo, React Native, and TypeScript. Empowers users to unlock doors, manage access rights, and trigger emergency operations—all from their smartphone.**

---

## 🛠️ Tech Stack

**Mobile Development:**

![Expo](https://img.shields.io/badge/Expo-262D3A?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**Backend & Security:**

![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![LDAP](https://img.shields.io/badge/LDAP-Auth-0052CC?style=for-the-badge&logo=windows&logoColor=white)
![mTLS](https://img.shields.io/badge/mTLS-Secure-green?style=for-the-badge&logo=letsencrypt&logoColor=white)

---

## 📖 About

KEY-RCODE is a comprehensive access control system that replaces traditional physical keys with secure, ephemeral QR codes. This mobile app serves as the primary user interface, enabling seamless interaction with the KEY-RCODE backend infrastructure.

The system is designed for enterprise environments with:
- **Active Directory integration** for centralized user and group management
- **Multi-site support** with on-premises and cloud deployment options
- **Role-based access control** (Admin/User) with granular permissions
- **Emergency operations** for critical security scenarios
- **Real-time access management** via secure API communication

---

## ✨ Key Features

### 🎫 Ephemeral QR Code Generation
- Generate time-limited, single-use QR codes for door access
- Secure token generation with backend validation
- Automatic expiration for enhanced security
- Visual QR code display optimized for scanning

### 🔐 LDAP Authentication & Session Management
- Enterprise-grade LDAP/AD authentication
- Secure session token storage using Expo SecureStore
- Persistent login across app restarts
- Automatic session validation and renewal

### 🚨 Emergency Operations
**For Regular Users:**
- Trigger emergency lock for your entire LDAP group
- Two-step confirmation to prevent accidental activation
- Comprehensive warning system about consequences
- Immediate group-wide security response

**For Administrators:**
- Emergency unlock for all doors system-wide
- Unlock specific users or entire groups
- View all locked users and groups in real-time
- Comprehensive emergency management dashboard

### 👥 Role-Based Access Control
- **Standard Users:** Access QR code generation, emergency lock, profile management
- **Administrators:** Full system control, user management, emergency overrides, lock/unlock operations
- Automatic UI adaptation based on user role
- Secure route protection with role validation

### 🌓 Dark Mode Support
- System-wide dark/light theme toggle
- Persistent theme preference
- Optimized color schemes for readability
- Smooth theme transitions

### 🏢 Multi-Site & Deployment Flexibility
- **On-Premises Mode:** Connect to local infrastructure with site-specific endpoints
- **Cloud Mode:** Use centralized cloud API for remote access
- Automatic site detection for LDAP users
- Easy site switching in configuration

---

## 🏗️ Architecture & Design

### Tech Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Mobile App (React Native)              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Contexts  │  │    Hooks     │  │    Services     │ │
│  │  (State)   │──│ (Business    │──│  (API Layer)    │ │
│  │            │  │   Logic)     │  │                 │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
│         │                │                    │          │
│  ┌──────▼────────────────▼────────────────────▼───────┐ │
│  │           UI Components & Screens                  │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS + mTLS
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Backend API (Node.js)                 │
│    ┌─────────────┐        ┌──────────────┐             │
│    │   Auth      │        │  Emergency   │             │
│    │  Service    │◄──────►│   Service    │             │
│    └─────────────┘        └──────────────┘             │
│            │                       │                     │
│    ┌───────▼───────────────────────▼─────────┐         │
│    │     Active Directory / LDAP              │         │
│    │  (User Auth & Group Management)          │         │
│    └──────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
```

### Application Layer Structure

| Layer | Components | Purpose |
|-------|-----------|---------|
| **Context Layer** | `UserContext`, `DarkModeContext` | Global state management for authentication, user data, and theming |
| **Hooks Layer** | `useStorageState`, `useEmergencyService`, `useSession`, `useDarkMode` | Reusable business logic and state access |
| **Services Layer** | `EmergencyService`, API clients | Backend communication, request/response handling |
| **UI Layer** | Screens, Components | User interface and interaction |
| **Navigation** | Expo Router | Route protection, tab navigation, authentication flows |

### Core Data Flow

```
User Action → UI Component → Hook → Service → Backend API
                                         ↓
                               Context Update
                                         ↓
                               UI Re-render
```

---

## 📱 App Screens & Features

### 🏠 Home Screen
- User welcome with name and group info
- Current site/deployment mode indicator
- Quick access to emergency lock function
- Two-step emergency confirmation for users
- Admin-specific emergency open button
- Adaptive UI based on user role

### 🔓 QR Code Screen
- One-tap QR code generation
- Large, scannable QR code display
- Token information display
- Loading states and error handling
- Automatic token refresh capability
- Lock status validation before generation

### 👤 Profile Screen
- User information display (name, email, domain, role)
- LDAP group membership information
- Current site and API mode indicators
- Dark mode toggle
- Logout functionality
- Session information

### ⚙️ Admin Panel (Admin-Only)
- **User Lock Management:**
  - View all locked users in real-time
  - Unlock individual users with username input
  - Bulk unlock operations
  - Lock timestamps and trigger information
  
- **Group Lock Management:**
  - View all locked LDAP groups
  - Unlock entire groups at once
  - Group lock status indicators
  - Your own user group status monitoring

- **Emergency Operations:**
  - Emergency door open (all exits)
  - System-wide unlock capabilities
  - Confirmation dialogs for critical actions
  - Real-time operation feedback

- **User Interface:**
  - Pull-to-refresh for updated data
  - Loading indicators for async operations
  - Tabbed interface for organized access
  - Search and filter capabilities (planned)

### 🔑 Login Screen
- Username/password authentication
- API mode selection (On-Premises/Cloud)
- Site selection for on-premises deployment
- Remember session option
- Secure credential handling
- Clear error messaging

---

## 🗂️ Project Structure

```
KEY-RCODE-AndroidApp/
├── app/
│   ├── _layout.tsx                    # Root layout with auth protection
│   ├── index.tsx                      # Landing/redirect screen
│   ├── login.tsx                      # Authentication screen
│   │
│   ├── config.ts                      # API URLs, site configuration
│   ├── UserContext.tsx                # Auth & user state management
│   ├── DarkModeContext.tsx            # Theme state management
│   ├── useStorageState.ts             # Secure persistent storage hook
│   │
│   ├── (tabs)/                        # Tab navigation group
│   │   ├── _layout.tsx                # Tab bar configuration
│   │   ├── home.tsx                   # Home dashboard
│   │   ├── qrcode.tsx                 # QR code generator
│   │   ├── profile.tsx                # User profile
│   │   └── admin.tsx                  # Admin control panel
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── QRCodeGenerator.tsx        # QR display component
│   │   └── AdminUnlockPanel.tsx       # Admin unlock interface
│   │
│   ├── hooks/                         # Custom hooks
│   │   └── useEmergencyService.ts     # Emergency operations hook
│   │
│   └── services/                      # API services
│       └── emergencyService.ts        # Emergency API client
│
├── assets/
│   └── images/                        # App images and logo
│
├── app.json                           # Expo configuration
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
└── eslint.config.js                   # Linting rules
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android emulator) or Expo Go app

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd KEY-RCODE-AndroidApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoints:**
   Edit `app/config.ts` to set your backend API URLs:
   ```typescript
   export const CLOUD_API_URL = "https://api.keyrcode.app/api/v1";
   
   export const KNOWN_SITES: SiteConfig[] = [
     {
       name: "YourSite",
       apiUrl: "https://localendpoint.yoursite.keyrcode.app:3000/api/v1",
       hostname: "localendpoint.yoursite.keyrcode.app",
       description: "Your Site Name",
     },
   ];
   ```

### Running the App

**Start Expo development server:**
```bash
npx expo start
```

**Run on specific platform:**
```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

**Using Expo Go:**
1. Install Expo Go on your mobile device
2. Scan the QR code displayed in the terminal
3. App will load on your device

---

## 🔄 Core Workflows

### Authentication Flow
1. User launches app → redirected to login screen
2. User selects API mode (On-Premises/Cloud) and site (if applicable)
3. User enters LDAP credentials
4. Backend validates credentials against Active Directory
5. Session token generated and stored securely
6. User redirected to Home screen
7. Session persists across app restarts

### QR Code Generation Flow
1. User navigates to QR Code tab
2. User taps "Generate QR Code" button
3. App requests token from backend with user ID
4. Backend validates session and lock status
5. If user is locked → error message displayed
6. If OK → ephemeral token generated
7. QR code rendered on screen
8. User scans QR at door reader for access

### Emergency Lock Flow (User)
1. User taps emergency button on Home screen
2. First tap → confirmation mode activated (5s timeout)
3. Second tap → severe warning dialog displayed
4. User confirms → emergency lock request sent to backend
5. Backend locks entire LDAP group
6. Success alert displayed
7. User automatically logged out
8. Admin intervention required to unlock

### Emergency Unlock Flow (Admin)
1. Admin navigates to Admin panel
2. Admin views locked users/groups
3. Admin selects unlock action:
   - Single user unlock (by username)
   - Group unlock (by selecting group)
   - Emergency door open (all doors)
4. Confirmation dialog displayed
5. Admin confirms → unlock request sent
6. Backend processes unlock
7. Success/failure feedback displayed
8. List refreshes automatically

---

## 🔒 Security Features

- **mTLS Encryption:** All API communication secured with mutual TLS
- **Secure Storage:** Session tokens encrypted using Expo SecureStore
- **Token Expiration:** Ephemeral QR codes auto-expire
- **Role Validation:** Backend validates user roles on every request
- **Session Validation:** Automatic session checks on sensitive operations
- **Lock Status Checks:** Prevents QR generation for locked users
- **LDAP Integration:** Centralized authentication via Active Directory
- **Emergency Safeguards:** Multi-step confirmations for critical operations

---

## 🧪 Development

### Code Style
```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npx eslint . --fix
```

### Testing
- Test on both iOS and Android platforms
- Verify role-based access controls
- Test emergency scenarios thoroughly
- Validate API error handling
- Check offline behavior

### Best Practices
- Use TypeScript for type safety
- Leverage React Context for global state
- Keep business logic in custom hooks
- Maintain separation between UI and services
- Follow React Native performance guidelines
- Use functional components with hooks
- Implement proper error boundaries

---

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strictly
3. Test features thoroughly before committing
4. Run `eslint` and fix all warnings
5. Document complex logic with comments
6. Keep components modular and reusable
7. Update README for significant changes

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Navigation](https://reactnavigation.org)

---

## 👨‍🎓 Academic Project

**Institution:** IUT de Valence - BUT Réseaux & Télécommunications  
**Academic Year:** 2025-2026  
**Project:** KEY-RCODE - Modern Access Control System

---

*Built with ❤️ using Expo and React Native*
