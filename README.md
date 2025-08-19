# 🔗 Relynk

**Tagline:** _"Create. Share. Get Paid. All Onchain."_

A Web3-native monetization platform that empowers creators, freelancers, and digital entrepreneurs to create payment links, sell digital products, and unlock content access — all without relying on Web2 platforms or centralized gatekeepers.

## 🎯 Overview

Relynk brings the simplicity of traditional payment link services like Gumroad or Mayar.id, but powered by **crypto, smart contracts, and self-custody**. It's designed to be the bridge between Web2 UX and Web3 infrastructure.

## ✨ Core Features

### 🔗 Onchain Payment Links

- Generate smart contract-backed links for crypto payments
- Support for stablecoins (USDC, IDRX, etc.)
- Fixed price, dynamic price, or donation-based options

### 📁 Digital Product Sales

- Upload files to IPFS for decentralized storage
- Automatic delivery after payment confirmation
- Support for eBooks, templates, design packs, and more

### 🎟️ Token-Gated Access

- Grant access to exclusive content after payment
- SBT/NFT-based proof of purchase
- Unlock private links, files, or pages

### 🧾 Custom Checkout Pages

- Personalized checkout experience per product
- Integrated wallet connection
- Clean, conversion-optimized design

### 🪪 User-Friendly Authentication

- Wallet-based authentication with SIWE (Sign-In with Ethereum)
- Social login options via NextAuth
- EVM wallet support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Web3**: Wagmi, Viem, SIWE
- **Authentication**: NextAuth.js with SIWE
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **State Management**: TanStack Query

## ✨ Features

### 🎯 Getting Started Dashboard
- **Interactive onboarding**: Step-by-step guidance for new users
- **Progress tracking**: Visual progress indicators showing completion status
- **Smart completion detection**: Automatically detects user progress based on real activity
- **Animated illustrations**: Engaging visual elements to enhance user experience
- **Collapsible interface**: Users can expand/collapse the getting started section

### 🔍 Public Explorer
- **Browse without wallet**: Explore all public payment links without connecting a wallet
- **Search and filter**: Find links by title, creator, type, or description
- **Real-time stats**: View platform statistics and trending content
- **Secure payments**: Connect wallet only when ready to make transactions
- **Link sharing**: Copy and share payment links easily

### 🔗 Core Features
- Create payment links for crypto transactions
- Share links for easy payments
- Track analytics and earnings
- Manage user profiles and settings

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lynk-web3
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:

   ```env
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Application Structure

### Homepage (`/`)

- Hero section with value proposition
- Feature showcase
- How it works explanation
- Social proof and testimonials

### Explorer (`/explorer`)

Public area accessible to everyone:

- **Browse Links** - Discover payment links, products, and content from creators
- **Search & Filter** - Find specific content by type, creator, or keywords
- **Platform Stats** - View total links, creators, volume, and transactions
- **Secure Payments** - Connect wallet only when ready to make transactions

### Dashboard (`/dashboard`)

Protected area requiring wallet authentication:

- **Overview** (`/dashboard`) - Main dashboard with key metrics
- **Links** (`/dashboard/links`) - Manage payment links and products
- **Payments** (`/dashboard/payments`) - Transaction history and status
- **Analytics** (`/dashboard/analytics`) - Performance insights and data export
- **Settings** (`/dashboard/settings`) - Account and wallet management

## 🔄 User Flow

1. **Connect Wallet** → Sign in with Ethereum wallet
2. **Create Product** → Upload files, set pricing, customize link
3. **Share Link** → Distribute via social media, bio, messaging
4. **Receive Payment** → Buyer pays with crypto through custom checkout
5. **Deliver Content** → Automatic access grant or file delivery

## 🎨 Design System

The application features a **neo-brutalist rose theme** with:

- Light mode optimized interface
- Bold, high-contrast design elements
- Pink accent colors with modern typography
- Responsive design for all devices

## 📦 Use Cases

- **Digital Creators**: Sell Notion templates, design assets, eBooks
- **Content Creators**: Gate exclusive podcasts, videos, courses
- **Freelancers**: Accept payments for services and deliverables
- **Communities**: Distribute access passes and memberships
- **Artists**: Sell digital art and collectibles
- **Educators**: Monetize educational content and courses

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (homepage)/     # Public homepage
│   ├── dashboard/      # Protected dashboard routes
│   └── api/           # API routes
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   └── views/         # Page-specific components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
└── types/             # TypeScript type definitions
```

## 🌐 Web3 Integration

- **Wallet Connection**: Multi-wallet support via Wagmi
- **Authentication**: SIWE for secure, decentralized login
- **Payments**: Direct smart contract interactions
- **Storage**: IPFS for decentralized file storage
- **Tokens**: Support for ERC-20 stablecoins

## 🔒 Security Features

- **Self-Custody**: Users maintain control of their wallets
- **No KYC Required**: Instant onboarding without identity verification
- **Smart Contract Security**: Audited payment mechanisms
- **Decentralized Storage**: IPFS for censorship-resistant file hosting

## 🚀 Future Roadmap

- **Referral System**: Affiliate and revenue sharing
- **Subscriptions**: Recurring payment support
- **NFT Integration**: Advanced token-gating features
- **Analytics Dashboard**: Enhanced metrics and insights
- **Email Notifications**: Post-payment communication
- **Multi-chain Support**: Expand beyond Ethereum

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Documentation**: `/docs` folder
- **Live Demo**: [Coming Soon]
- **Support**: [Contact Information]

---

**Built with ❤️ for the Web3 creator economy**
