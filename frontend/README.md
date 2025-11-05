# DeFi Yield Aggregator Frontend

A modern React-based dashboard for the DeFi Cross-Chain Yield Aggregator, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI/UX** - Clean, responsive design with dark/light theme support
- 🔗 **Wallet Integration** - QIE Wallet SDK integration for seamless wallet connection
- 📊 **Real-time Portfolio Visualization** - Interactive charts and analytics using Chart.js and Recharts
- 🚀 **Yield Optimization** - Advanced portfolio optimization with ML algorithms
- 🌉 **Cross-chain Bridge** - Seamless asset transfers across multiple networks
- 📱 **Responsive Design** - Mobile-first approach with excellent mobile experience
- ⚡ **Performance Optimized** - Fast loading with code splitting and lazy loading
- 🧪 **Comprehensive Testing** - Unit tests, integration tests, and E2E tests

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Chart.js, Recharts
- **Wallet**: QIE Wallet SDK (mocked)
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── Dashboard/         # Dashboard-specific components
│   └── Layout/            # Layout components (Header, Sidebar, etc.)
├── hooks/                 # Custom React hooks
├── services/              # API and external service integrations
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── __tests__/            # Test files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Run TypeScript type checking

## Key Components

### Dashboard Layout
- **DashboardLayout**: Main layout wrapper with sidebar and header
- **Sidebar**: Navigation sidebar with wallet status
- **Header**: Top header with theme toggle and notifications

### Dashboard Components
- **PortfolioOverview**: Portfolio summary cards with key metrics
- **PortfolioChart**: Interactive charts for performance and allocation
- **StrategiesList**: List of available yield strategies
- **RecentTransactions**: Recent transaction history

### Wallet Integration
- **useWallet**: Custom hook for wallet management
- **QIEWalletService**: Service for QIE Wallet SDK integration
- **ConnectWalletModal**: Modal for wallet connection

### State Management
- **useStore**: Zustand store for global state
- **useStrategies**: Hook for strategy data management
- **usePortfolio**: Hook for portfolio data management

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Component and hook testing with React Testing Library
- **Integration Tests**: API integration and wallet connection tests
- **E2E Tests**: Full user flow testing (planned)

Run tests:
```bash
npm run test
npm run test:coverage
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_QIE_NETWORK=testnet
NEXT_PUBLIC_CHAIN_ID=5
NEXT_PUBLIC_QIE_API_KEY=your_api_key
NEXT_PUBLIC_QIE_SECRET_KEY=your_secret_key
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

1. Build the project: `npm run build`
2. Start the production server: `npm run start`
3. Configure your hosting platform accordingly

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@defi-yield-aggregator.com or join our Discord community.
