# 🔗 Relynk

**Tagline:** _"Create. Share. Get Paid. All Onchain."_

A Web3-native monetization platform that empowers creators, freelancers, and digital entrepreneurs to create payment links, sell digital products, and unlock content access — all without relying on Web2 platforms or centralized gatekeepers.

## 🎯 Overview

Relynk brings the simplicity of traditional payment link services like Gumroad or Mayar.id, but powered by **crypto, smart contracts, and self-custody**. It's designed to be the bridge between Web2 UX and Web3 infrastructure.

## ✨ Core Features

### 🔗 Onchain Payment Links
- Generate smart contract-backed links for crypto payments
- Support for stablecoins (USDC, USDT, IDRX)
- Fixed price, dynamic price, or donation-based options
- Automatic payment processing and verification

### 📁 Digital Product Sales
- Upload files to IPFS for decentralized storage
- Automatic delivery after payment confirmation
- Support for eBooks, templates, design packs, and more
- Encrypted content delivery for premium products

### 🎟️ Token-Gated Access
- Grant access to exclusive content after payment
- SBT/NFT-based proof of purchase
- Unlock private links, files, or pages
- Time-based or usage-based access controls

### 🧾 Custom Checkout Pages
- Personalized checkout experience per product
- Integrated wallet connection
- Clean, conversion-optimized design
- Mobile-responsive interface

### 🪪 User-Friendly Authentication
- Wallet-based authentication with SIWE (Sign-In with Ethereum)
- Social login options via NextAuth
- Multi-chain EVM wallet support
- Seamless onboarding experience

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui with Radix UI primitives
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)

### Web3 Integration
- **Wallet Connection**: Wagmi v2 + Viem
- **Authentication**: SIWE (Sign-In with Ethereum)
- **Multi-chain Support**: Lisk Sepolia, Scroll Sepolia, Morph Holesky, Celo Sepolia, Mantle Sepolia
- **Smart Contracts**: Custom ProfileRegistry and RelynkProcessor contracts

### Storage & Services
- **Decentralized Storage**: IPFS via Pinata
- **Email Service**: Resend
- **File Upload**: Custom image upload service
- **Metadata Management**: Unified IPFS service

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js with Turbopack

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: For version control
- **Web3 Wallet**: MetaMask, WalletConnect, or compatible wallet

### Required Accounts & API Keys

1. **Pinata Account**: For IPFS storage
   - Sign up at [pinata.cloud](https://pinata.cloud)
   - Get your API key and secret

2. **Resend Account**: For email services
   - Sign up at [resend.com](https://resend.com)
   - Get your API key

3. **WalletConnect Project ID**: For wallet connections
   - Create project at [walletconnect.com](https://walletconnect.com)

4. **Xellar App ID**: For enhanced wallet integration
   - Register at Xellar platform

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/relynk-frontend.git
cd relynk-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt-token
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key

# Resend Email Configuration
RESEND_API_KEY=your-resend-api-key

# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Xellar Configuration
NEXT_PUBLIC_XELLAR_APP_ID=your-xellar-app-id

# API Configuration (optional)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm start
```

## 🎮 Usage Examples

### Creating a Payment Link

```typescript
import { useCreatePaymentLink } from '@/hooks/use-payment-links';
import { LinkType, AmountType, UsageType } from '@/types/relynk';

const { mutate: createLink } = useCreatePaymentLink();

const createPaymentLink = () => {
  createLink({
    title: "Premium Course Access",
    description: "Get lifetime access to our Web3 development course",
    linkType: LinkType.CONTENT,
    amountType: AmountType.FIXED,
    usageType: UsageType.REUSABLE,
    amount: "99.00",
    token: "0x498f995ce39AFCB27328eDe058c3B09e4925D4a0", // USDC
    expiresIn: 720, // 30 days
  });
};
```

### Processing a Payment

```typescript
import { useRelynkProcessor } from '@/hooks/use-relynk-processor';

const { processPayment } = useRelynkProcessor();

const handlePayment = async (linkData, signature) => {
  try {
    const result = await processPayment({
      linkData,
      signature,
      customAmount: parseUnits("99", 6), // For USDC
    });
    
    if (result.success) {
      console.log('Payment successful:', result.transactionHash);
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## 🌐 Supported Networks

Relynk currently supports the following testnets:

| Network | Chain ID | Block Explorer |
|---------|----------|----------------|
| Lisk Sepolia | 4202 | [sepolia-blockscout.lisk.com](https://sepolia-blockscout.lisk.com) |
| Scroll Sepolia | 534351 | [sepolia.scrollscan.com](https://sepolia.scrollscan.com) |
| Morph Holesky | 2810 | [explorer-holesky.morphl2.io](https://explorer-holesky.morphl2.io) |
| Celo Sepolia | 11142220 | [explorer.celo.org/alfajores](https://explorer.celo.org/alfajores) |
| Mantle Sepolia | 5003 | [explorer.sepolia.mantle.xyz](https://explorer.sepolia.mantle.xyz) |

## 💰 Supported Tokens

- **USDC**: USD Coin (6 decimals)
- **USDT**: Tether USD (6 decimals)
- **IDRX**: Indonesian Rupiah Token (2 decimals)

## 📚 API Documentation

### Smart Contract Interactions

The application interacts with two main smart contracts:

1. **ProfileRegistry**: Manages user profiles and usernames
2. **RelynkProcessor**: Handles payment processing and link validation

### Key Hooks

- `usePaymentLinks()`: Fetch and manage payment links
- `useRelynkProcessor()`: Process payments and donations
- `useProfileRegistry()`: Manage user profiles
- `useSiweAuth()`: Handle wallet authentication

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXT_PUBLIC_PINATA_JWT` | Pinata JWT token | Yes |
| `RESEND_API_KEY` | Resend email API key | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_XELLAR_APP_ID` | Xellar application ID | Yes |

### Network Configuration

To add support for additional networks, update the configuration in:
- `src/lib/wagmi-config.ts`
- `src/lib/contracts.ts`
- `src/app/provider.tsx`

## 🤝 Contributing Guidelines

1. **Fork the repository** and create your feature branch
2. **Follow the coding standards** defined in the project
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description

### Code Style

- Use TypeScript for all new code
- Follow the existing naming conventions
- Use Prettier for code formatting
- Write meaningful commit messages

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request

## 🐛 Troubleshooting

### Common Issues

**Wallet Connection Issues**
- Ensure you're on a supported network
- Clear browser cache and cookies
- Try a different wallet or browser

**IPFS Upload Failures**
- Check your Pinata API credentials
- Verify file size limits
- Ensure stable internet connection

**Transaction Failures**
- Check token balance and allowances
- Verify gas fees are sufficient
- Ensure contract addresses are correct

### Getting Help

- Check the [troubleshooting guide](./for-developers.md#troubleshooting)
- Review the [API documentation](./api-reference.md)
- Open an issue on GitHub
- Join our Discord community

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Website**: [relynk.app](https://relynk.app)
- **Documentation**: [docs.relynk.app](https://docs.relynk.app)
- **GitHub**: [github.com/relynk/relynk-frontend](https://github.com/relynk/relynk-frontend)
- **Discord**: [discord.gg/relynk](https://discord.gg/relynk)
- **Twitter**: [@RelynkApp](https://twitter.com/RelynkApp)

---

**Built with ❤️ by the Relynk Team**

*Empowering creators in the decentralized economy*