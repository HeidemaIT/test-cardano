# Cardano Asset Explorer

A full-stack web application for exploring Cardano wallet assets with real-time data from multiple providers.

## Features

- 🔐 **Authentication**: Supabase magic link authentication
- 💰 **Asset Tracking**: View ADA and token balances from Cardano addresses
- 📊 **Multiple Providers**: Support for Koios, Cardanoscan, Bitvavo, and custom providers
- 💾 **Saved Addresses**: Save and manage frequently used wallet addresses
- 🌙 **Dark Theme**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure**: JWT-based authentication with rate limiting

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Vite
- **Backend**: Node.js, Express, TypeScript, SQLite
- **Authentication**: Supabase
- **Database**: SQLite with user and saved addresses tables
- **APIs**: Koios, CoinGecko for real-time data

## Environment Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-cardano
   ```

2. **Set up environment variables**
   
   **Server Setup:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your actual values
   ```
   
   **Client Setup:**
   ```bash
   cd client
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Start the development servers**
   ```bash
   # Start server (in server directory)
   npm run dev
   
   # Start client (in client directory, new terminal)
   npm run dev
   ```

### Required Environment Variables

#### Server (.env)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 3000)

#### Client (.env)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3000)

## Usage

1. Open the application in your browser
2. Sign in using your email (magic link authentication)
3. Enter a Cardano wallet address
4. View assets, balances, and USD/EUR values
5. Save addresses for quick access later

## Development

### Available Scripts

**Server:**
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm test`: Run tests

**Client:**
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Project Structure

```
test-cardano/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utility libraries
│   └── .env.example       # Client environment template
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── config/        # Configuration files
│   └── .env.example       # Server environment template
└── .env.example           # Root environment template
```
