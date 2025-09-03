# Developer Documentation

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Git**: For version control
- **Web3 Wallet**: MetaMask or similar for testing
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

### Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/relynk-frontend.git
   cd relynk-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

   Configure the following environment variables:
   ```env
   # Required
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   
   # IPFS/Pinata Configuration
   NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt
   NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
   
   # Optional: Analytics
   NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
   
   # Development
   NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
relynk-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── link/              # Payment link pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── web3/             # Web3-specific components
│   ├── hooks/                # Custom React hooks
│   │   ├── use-payment-links.ts
│   │   ├── use-siwe-auth.ts
│   │   └── use-ipfs.ts
│   ├── lib/                  # Utility libraries
│   │   ├── contracts.ts      # Smart contract configs
│   │   ├── wagmi-config.ts   # Wagmi configuration
│   │   ├── utils.ts          # General utilities
│   │   └── validations.ts    # Form validations
│   ├── services/             # External service integrations
│   │   ├── api.ts           # API client
│   │   ├── ipfs.ts          # IPFS service
│   │   └── analytics.ts     # Analytics service
│   └── types/               # TypeScript type definitions
│       ├── relynk.ts        # Core types
│       └── api.ts           # API types
├── public/                  # Static assets
├── docs/                   # Documentation
├── .env.example           # Environment template
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Development Workflow

### Git Workflow

We follow a **Git Flow** branching strategy:

1. **Main Branches**
   - `main`: Production-ready code
   - `develop`: Integration branch for features

2. **Feature Branches**
   ```bash
   # Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/payment-link-creation
   
   # Work on your feature
   git add .
   git commit -m "feat: add payment link creation form"
   
   # Push and create PR
   git push origin feature/payment-link-creation
   ```

3. **Branch Naming Convention**
   - `feature/description` - New features
   - `bugfix/description` - Bug fixes
   - `hotfix/description` - Critical production fixes
   - `chore/description` - Maintenance tasks

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(payment): add USDC payment support"
git commit -m "fix(auth): resolve SIWE signature validation"
git commit -m "docs(api): update smart contract documentation"
```

### Pull Request Process

1. **Before Creating PR**
   - Ensure all tests pass: `npm run test`
   - Run linting: `npm run lint`
   - Check TypeScript: `npm run type-check`
   - Test build: `npm run build`

2. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   ```

3. **Review Process**
   - At least 1 approval required
   - All CI checks must pass
   - No merge conflicts
   - Squash and merge preferred

## 📝 Code Standards

### TypeScript Guidelines

1. **Strict Type Safety**
   ```typescript
   // ✅ Good: Explicit types
   interface PaymentLinkData {
     id: string;
     title: string;
     amount: bigint;
     currency: SupportedToken;
     createdAt: Date;
   }
   
   // ❌ Bad: Any types
   const linkData: any = fetchLinkData();
   ```

2. **Use Enums for Constants**
   ```typescript
   // ✅ Good: Type-safe enums
   enum LinkType {
     PAYMENT = 'payment',
     DONATION = 'donation',
     PRODUCT = 'product'
   }
   
   // ❌ Bad: String literals
   const linkType = 'payment';
   ```

3. **Proper Error Handling**
   ```typescript
   // ✅ Good: Typed error handling
   type Result<T, E = Error> = 
     | { success: true; data: T }
     | { success: false; error: E };
   
   async function createPaymentLink(data: CreateLinkFormData): Promise<Result<PaymentLink>> {
     try {
       const link = await api.createLink(data);
       return { success: true, data: link };
     } catch (error) {
       return { success: false, error: error as Error };
     }
   }
   ```

### React Component Guidelines

1. **Component Structure**
   ```typescript
   // ✅ Good: Well-structured component
   interface PaymentFormProps {
     onSubmit: (data: PaymentData) => void;
     isLoading?: boolean;
     initialData?: Partial<PaymentData>;
   }
   
   export function PaymentForm({ onSubmit, isLoading = false, initialData }: PaymentFormProps) {
     // Hooks at the top
     const [formData, setFormData] = useState<PaymentData>(initialData || {});
     const { address } = useAccount();
     
     // Event handlers
     const handleSubmit = useCallback((e: FormEvent) => {
       e.preventDefault();
       onSubmit(formData);
     }, [formData, onSubmit]);
     
     // Early returns
     if (!address) {
       return <ConnectWalletPrompt />;
     }
     
     // Main render
     return (
       <form onSubmit={handleSubmit}>
         {/* Form content */}
       </form>
     );
   }
   ```

2. **Custom Hooks**
   ```typescript
   // ✅ Good: Reusable hook with proper typing
   interface UsePaymentLinksReturn {
     links: PaymentLink[];
     isLoading: boolean;
     error: Error | null;
     createLink: (data: CreateLinkFormData) => Promise<void>;
     updateLink: (id: string, data: Partial<PaymentLink>) => Promise<void>;
     deleteLink: (id: string) => Promise<void>;
   }
   
   export function usePaymentLinks(): UsePaymentLinksReturn {
     // Implementation
   }
   ```

### Styling Guidelines

1. **Tailwind CSS Best Practices**
   ```typescript
   // ✅ Good: Semantic class grouping
   <button className="
     inline-flex items-center justify-center
     px-4 py-2 
     text-sm font-medium text-white
     bg-blue-600 hover:bg-blue-700
     border border-transparent rounded-md
     focus:outline-none focus:ring-2 focus:ring-blue-500
     disabled:opacity-50 disabled:cursor-not-allowed
     transition-colors duration-200
   ">
     Create Link
   </button>
   
   // ✅ Better: Use component variants
   <Button variant="primary" size="md">
     Create Link
   </Button>
   ```

2. **Component Variants with CVA**
   ```typescript
   import { cva, type VariantProps } from 'class-variance-authority';
   
   const buttonVariants = cva(
     'inline-flex items-center justify-center rounded-md font-medium transition-colors',
     {
       variants: {
         variant: {
           primary: 'bg-blue-600 text-white hover:bg-blue-700',
           secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
           outline: 'border border-gray-300 bg-transparent hover:bg-gray-50'
         },
         size: {
           sm: 'h-8 px-3 text-sm',
           md: 'h-10 px-4',
           lg: 'h-12 px-6 text-lg'
         }
       },
       defaultVariants: {
         variant: 'primary',
         size: 'md'
       }
     }
   );
   ```

### Web3 Integration Guidelines

1. **Wagmi Hook Usage**
   ```typescript
   // ✅ Good: Proper error handling and loading states
   function PaymentComponent() {
     const { address, isConnected } = useAccount();
     const { data: balance, isLoading, error } = useBalance({
       address,
       token: USDC_ADDRESS,
       enabled: !!address
     });
     
     const { writeContract, isPending } = useWriteContract({
       mutation: {
         onSuccess: (hash) => {
           toast.success(`Payment successful! Hash: ${hash}`);
         },
         onError: (error) => {
           toast.error(`Payment failed: ${error.message}`);
         }
       }
     });
     
     if (!isConnected) return <ConnectWallet />;
     if (isLoading) return <Skeleton />;
     if (error) return <ErrorMessage error={error} />;
     
     return (
       <div>
         <p>Balance: {formatUnits(balance?.value || 0n, 6)} USDC</p>
         <Button 
           onClick={() => writeContract({
             address: RELYNK_PROCESSOR_ADDRESS,
             abi: RelynkProcessorABI,
             functionName: 'processPayment',
             args: [linkId, amount]
           })}
           disabled={isPending}
         >
           {isPending ? 'Processing...' : 'Pay Now'}
         </Button>
       </div>
     );
   }
   ```

2. **Smart Contract Interactions**
   ```typescript
   // ✅ Good: Type-safe contract calls
   import { parseUnits, formatUnits } from 'viem';
   
   async function processPayment({
     linkId,
     amount,
     token
   }: {
     linkId: string;
     amount: string;
     token: SupportedToken;
   }) {
     const amountWei = parseUnits(amount, token.decimals);
     
     // First approve token spending
     await writeContract({
       address: token.address,
       abi: ERC20_ABI,
       functionName: 'approve',
       args: [RELYNK_PROCESSOR_ADDRESS, amountWei]
     });
     
     // Then process payment
     await writeContract({
       address: RELYNK_PROCESSOR_ADDRESS,
       abi: RelynkProcessorABI,
       functionName: 'processPayment',
       args: [linkId, amountWei, token.address]
     });
   }
   ```

## 🧪 Testing Strategy

### Unit Testing

```typescript
// utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, validateSlug } from './utils';

describe('formatCurrency', () => {
  it('should format USDC correctly', () => {
    expect(formatCurrency('1000000', 'USDC')).toBe('1.00 USDC');
  });
  
  it('should handle zero amounts', () => {
    expect(formatCurrency('0', 'USDC')).toBe('0.00 USDC');
  });
});

describe('validateSlug', () => {
  it('should accept valid slugs', () => {
    expect(validateSlug('my-product-123')).toBe(true);
  });
  
  it('should reject invalid characters', () => {
    expect(validateSlug('my product!')).toBe(false);
  });
});
```

### Component Testing

```typescript
// PaymentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from './PaymentForm';
import { TestWrapper } from '../test-utils';

describe('PaymentForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    
    render(
      <TestWrapper>
        <PaymentForm onSubmit={onSubmit} />
      </TestWrapper>
    );
    
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '10' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Link' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        amount: '10',
        currency: 'USDC'
      });
    });
  });
});
```

### Integration Testing

```typescript
// payment-flow.test.ts
import { test, expect } from '@playwright/test';

test('complete payment flow', async ({ page }) => {
  // Navigate to payment link
  await page.goto('/link/test-payment-link');
  
  // Connect wallet (mocked)
  await page.click('[data-testid="connect-wallet"]');
  
  // Fill payment form
  await page.fill('[data-testid="amount-input"]', '10');
  
  // Submit payment
  await page.click('[data-testid="pay-button"]');
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 🔧 Development Tools

### VS Code Configuration

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Debugging

1. **Browser DevTools**
   - Use React DevTools for component inspection
   - Wagmi DevTools for Web3 state debugging
   - Network tab for API calls

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js: debug server-side",
         "type": "node",
         "request": "attach",
         "port": 9229,
         "skipFiles": ["<node_internals>/**"]
       },
       {
         "name": "Next.js: debug client-side",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:3000"
       }
     ]
   }
   ```

3. **Console Debugging**
   ```typescript
   // Use structured logging
   console.log('Payment processing:', {
     linkId,
     amount: formatUnits(amount, 6),
     token: token.symbol,
     timestamp: new Date().toISOString()
   });
   
   // Use debug library for conditional logging
   import debug from 'debug';
   const log = debug('relynk:payment');
   log('Processing payment for link %s', linkId);
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   ```typescript
   // Check if wallet is installed
   if (typeof window.ethereum === 'undefined') {
     throw new Error('Please install MetaMask');
   }
   
   // Handle connection errors
   try {
     await connector.connect();
   } catch (error) {
     if (error.code === 4001) {
       // User rejected connection
       toast.error('Please connect your wallet to continue');
     } else {
       toast.error('Failed to connect wallet');
     }
   }
   ```

2. **Transaction Failures**
   ```typescript
   // Check for common transaction errors
   const handleTransactionError = (error: Error) => {
     if (error.message.includes('insufficient funds')) {
       toast.error('Insufficient balance for transaction');
     } else if (error.message.includes('user rejected')) {
       toast.error('Transaction cancelled by user');
     } else if (error.message.includes('gas')) {
       toast.error('Transaction failed due to gas issues');
     } else {
       toast.error(`Transaction failed: ${error.message}`);
     }
   };
   ```

3. **IPFS Upload Issues**
   ```typescript
   // Retry logic for IPFS uploads
   const uploadWithRetry = async (file: File, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await ipfsService.upload(file);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   };
   ```

### Performance Optimization

1. **Bundle Analysis**
   ```bash
   # Analyze bundle size
   npm run build
   npm run analyze
   ```

2. **Code Splitting**
   ```typescript
   // Lazy load heavy components
   const PaymentDashboard = lazy(() => import('./PaymentDashboard'));
   
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <PaymentDashboard />
       </Suspense>
     );
   }
   ```

3. **Image Optimization**
   ```typescript
   import Image from 'next/image';
   
   // Use Next.js Image component
   <Image
     src={productImage}
     alt="Product"
     width={400}
     height={300}
     placeholder="blur"
     blurDataURL="data:image/jpeg;base64,..."
   />
   ```

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

### Tools
- [Viem Documentation](https://viem.sh)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

### Web3 Resources
- [Ethereum Development Documentation](https://ethereum.org/developers)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)

---

*This documentation is maintained by the development team. Please keep it updated as the project evolves.*