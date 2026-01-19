<div align="center">

# 🌳 Roots of You

**Your Farcaster friendships, visualized as a living tree**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Base](https://img.shields.io/badge/Base-Blockchain-0052FF?style=for-the-badge&logo=coinbase)](https://base.org/)
[![Farcaster](https://img.shields.io/badge/Farcaster-MiniApp-8A63D2?style=for-the-badge)](https://www.farcaster.xyz/)

[Live Demo](https://rootsofyou.xyz) • [Documentation](#documentation) • [Features](#-features) • [Tech Stack](#-tech-stack)

![Roots of You Banner](https://via.placeholder.com/1200x400/4d7c36/ffffff?text=Roots+of+You+-+Visualize+Your+Social+Graph)

</div>

---

## 📖 Overview

**Roots of You** transforms your Farcaster social connections into a beautiful, interactive tree visualization that you can mint as a free NFT on Base blockchain. Each friend is represented as a leaf, with stronger connections appearing as larger, closer leaves.

### Why Roots of You?

- 🌲 **Visual Social Graph**: See your Farcaster friendships as an organic, living tree
- 🎨 **AI-Powered Visualization**: Beautiful, unique tree designs generated for each user
- 🔗 **Web3 Native**: Mint your tree as a free NFT on Base blockchain
- 🤝 **Community Exploration**: Discover and explore friends' trees across the network
- 📱 **Farcaster MiniApp**: Seamless integration with Farcaster ecosystem

---

## ✨ Features

### 🌟 Core Features

| Feature | Description |
|---------|-------------|
| **Interactive Tree Visualization** | Dynamic SVG-based tree that animates and responds to user interaction |
| **Mutual Affinity Scoring** | Friend connections sized based on Neynar's mutual affinity algorithm |
| **Free NFT Minting** | Mint your unique tree visualization as an NFT on Base (no gas fees!) |
| **Friend Exploration** | Click any leaf to explore that friend's tree and their connections |
| **Social Sharing** | Share your tree directly to Farcaster with auto-tagging of top friends |
| **Real-time Updates** | Tree grows and updates as your Farcaster connections evolve |

### 🎁 Advanced Features

- **Gift Box System**: Claim special rewards through interactive gift box mechanics
- **Tree Animations**: Smooth, organic animations that make the tree feel alive
- **Responsive Design**: Works seamlessly on mobile and desktop
- **IPFS Storage**: All trees permanently stored on IPFS via Pinata
- **Wallet Integration**: Full Web3 wallet support via Wagmi/Viem
- **Tutorial System**: Interactive onboarding for new users

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB database
- Upstash Redis instance
- Neynar API key
- Pinata account (for IPFS)
- Base blockchain RPC access

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/roots-of-you.git
cd roots-of-you

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Application
NEXT_PUBLIC_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/roots-of-you

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Farcaster (Neynar)
NEYNAR_API_KEY=your_neynar_api_key

# IPFS (Pinata)
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=gateway.pinata.cloud

# Blockchain
SIGNER_PRIVATE_KEY=0x...

# Notifications (Optional)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
```

---

## 🏗️ Project Structure

```
roots-of-you/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── tree/                 # Tree generation & signing
│   │   ├── neynar/              # Farcaster data fetching
│   │   ├── ipfs/                # IPFS upload handlers
│   │   ├── mint/                # NFT minting logic
│   │   └── webhook/             # Farcaster webhooks
│   ├── page.tsx                 # Landing page
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── RootsOfYou/              # Tree visualization components
│   │   ├── TreeVisualization.tsx
│   │   ├── FriendNode.tsx
│   │   └── ZoomedTreeView.tsx
│   ├── GiftBox.tsx              # Reward system
│   └── providers.tsx            # Context providers
├── lib/                         # Utilities
│   ├── contracts.ts             # Smart contract ABIs
│   ├── database.ts              # MongoDB models
│   ├── svg-to-image.ts          # SVG rendering
│   └── constants.ts             # App constants
├── hooks/                       # Custom React hooks
│   ├── useMintTreeNFT.ts       # NFT minting hook
│   └── use-nft-supply.ts       # Supply tracking
├── contract/                    # Smart contracts
│   └── rootsofyou.sol          # NFT contract
└── public/                      # Static assets
```

---

## 💻 Tech Stack

### Frontend

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12
- **State Management**: TanStack Query (React Query)

### Blockchain

- **Chain**: Base (Ethereum L2)
- **Web3 Library**: Wagmi 2.14 + Viem 2.22
- **Smart Contracts**: Solidity
- **NFT Standard**: ERC-721

### Backend & APIs

- **Framework**: Next.js API Routes
- **Database**: MongoDB 6
- **Cache**: Upstash Redis
- **Storage**: Pinata (IPFS)
- **Social Data**: Neynar API (Farcaster)

### Farcaster Integration

- **SDK**: @farcaster/miniapp-sdk 0.1.7
- **Frame Kit**: @farcaster/frame-sdk 0.1.12
- **Notifications**: Pusher 5.2

---

## 📚 Documentation

### How It Works

1. **Connect Farcaster**: Users authenticate via Farcaster Frame/MiniApp
2. **Fetch Social Graph**: App retrieves user's best friends via Neynar API
3. **Calculate Affinity**: Mutual affinity scores determine leaf size/position
4. **Generate Tree**: SVG tree is dynamically created with D3.js-like algorithms
5. **Mint NFT**: Users can mint their tree as a free NFT on Base
6. **Share**: Trees can be shared on Farcaster with friend tagging

### NFT Minting Flow

See [NFT_MINTING_FLOW_DOCUMENTATION.md](./NFT_MINTING_FLOW_DOCUMENTATION.md) for complete technical documentation of the minting process, including:

- Image generation with AI
- IPFS upload workflows
- Signature generation
- Smart contract interactions
- Metadata standards

### Tree Visualization Algorithm

The tree uses a custom radial layout algorithm:

```typescript
// Simplified version
1. Root user = trunk center
2. Friends sorted by affinity score
3. Higher affinity = closer to center, larger size
4. Distribute leaves in circular/organic pattern
5. Add connecting branches with SVG paths
6. Apply physics-based animations
```

---

## 🎨 Key Components

### TreeVisualization

The main tree rendering component with SVG-based visualization.

```typescript
<TreeVisualization
  rootUser={{ fid, username, pfp_url }}
  friends={friendsWithProfiles}
  totalMutualAffinityScore={score}
  onNodeClick={handleClick}
  onShare={handleShare}
/>
```

### FriendNode

Individual friend representation as a tree leaf.

```typescript
<FriendNode
  friend={friendData}
  position={{ x, y }}
  size={calculatedSize}
  onClick={() => viewProfile(fid)}
/>
```

### MintStatus

Displays NFT minting status and progress.

```typescript
<MintStatus
  hasMinted={boolean}
  supply={currentSupply}
  maxSupply={maxSupply}
/>
```

---

## 🔐 Smart Contract

The Roots of You NFT contract is deployed on Base:

- **Contract Address**: `0x249c480B3591D164b03c22a1bD9257bb55040381`
- **Network**: Base Mainnet
- **Standard**: ERC-721
- **Features**:
  - Free minting with backend signature
  - IPFS metadata storage
  - Token URI management
  - Supply tracking

### Key Functions

```solidity
function mintNFT(
    uint256 fid,
    string memory tokenUri,
    bytes memory signature
) external payable;

function tokenURI(uint256 tokenId) external view returns (string);
```

---

## 🧪 Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration
```

### Building for Production

```bash
# Create production build
pnpm build

# Run production server
pnpm start
```

### Linting & Formatting

```bash
# Lint code with Biome
pnpm lint

# Format code
pnpm format
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Setup

Ensure all environment variables are set in your deployment platform:

1. Go to your Vercel project settings
2. Add all variables from `.env.local`
3. Redeploy

### Database Setup

1. Create MongoDB Atlas cluster
2. Whitelist Vercel IP addresses
3. Update `MONGODB_URI` with connection string

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use Biome for linting/formatting
- Write meaningful commit messages
- Add tests for new features

---

## 📊 API Reference

### Neynar Integration

#### Get Best Friends

```typescript
GET /api/neynar/best-friends?fid=${fid}&limit=12

Response:
{
  users: [
    {
      fid: number,
      username: string,
      mutual_affinity_score: number
    }
  ]
}
```

#### Get Bulk Users

```typescript
GET /api/neynar/users/bulk?fids=${fids}

Response:
{
  users: [
    {
      fid: number,
      username: string,
      display_name: string,
      pfp_url: string,
      follower_count: number
    }
  ]
}
```

### Tree API

#### Generate Tree Signature

```typescript
POST /api/tree/generate-signature

Body: { fid: number, address: string }

Response:
{
  signature: string,
  tokenUri: string,
  mintType: "free" | "public"
}
```



### Common Issues

**Issue**: Tree not loading
- **Solution**: Check Neynar API key is valid and has sufficient credits

**Issue**: Minting fails
- **Solution**: Ensure wallet is connected to Base network and has sufficient ETH for gas

**Issue**: IPFS upload errors
- **Solution**: Verify Pinata JWT token is correct and account has storage space

### Debug Mode

Enable debug logging:

```typescript
// In .env.local
NEXT_PUBLIC_DEBUG=true
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Farcaster**: For the amazing social protocol
- **Neynar**: For social graph APIs
- **Base**: For the L2 infrastructure
- **Pinata**: For IPFS storage
- **Community**: All our users and contributors

---

## 📞 Support

- **Documentation**: [Full Docs](./NFT_MINTING_FLOW_DOCUMENTATION.md)
- **Discord**: [Join our community](#)
- **Twitter**: [@RootsOfYou](#)
- **Email**: support@rootsofyou.xyz

---

<div align="center">

**Built with ❤️ by the Roots of You team**

[Website](https://rootsofyou.xyz) • [GitHub](https://github.com/yourusername/roots-of-you) • [Farcaster](https://warpcast.com/rootsofyou)

</div>


--- 

##  Backend API Optimizations (January 2026)

Significant performance enhancements have been implemented across the backend APIs to ensure a faster, more reliable user experience.

###  Performance Enhancements
- **Multi-Level Caching**:
  - **MongoDB Integration**: Implemented 24-hour persistent caching for Neynar API responses (Best Friends, Bulk User Data) to significantly reduce external API latency and rate-limit hits.
  - **Browser/CDN Optimization**: Added `Cache-Control` headers (`public, s-maxage=3600`) to all common GET endpoints, enabling efficient data retrieval from edge locations and browser caches.
- **Stale-While-Revalidate**: Integrated SWR patterns in API responses, allowing the UI to display cached data immediately while updating it in the background if necessary.
- **Singleton Pattern for Services**: 
  - Optimized the **Pusher integration** by implementing a singleton pattern for the server instance, preventing redundant initializations and reducing memory overhead during gift box claims.
- **API Cleanliness & Reliability**:
  - Removed debug logs and optimized signature generation logic for faster NFT minting flows.
  - Improved error handling with fallback to stale cache in case of external service outages.
  - Fixed TypeScript type safety issues in bulk data processing for more robust execution.

##  Recent UI Improvements (January 2026)

The interface has been significantly enhanced with a premium design system:

-  **Modern Design System**: Glass morphism effects, premium gradients, and professional typography (Inter font)
-  **Enhanced Components**: Improved error states, loading screens, and user feedback with friendly messaging  
-  **Premium Aesthetics**: Smooth animations, hover effects, and visual polish throughout
-  **Better UX**: Consistent visual language, improved readability, and intuitive interactions
-  **SEO Optimization**: Updated landing page metadata with rich descriptions and engaging titles for better social discovery.

See [UI_IMPROVEMENTS.md](./UI_IMPROVEMENTS.md) for complete details on all enhancements.

