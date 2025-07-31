

# Sui Testnet Faucet - Backend

A robust Express.js backend API for managing Sui testnet token distribution with Redis-based rate limiting, PostgreSQL database, and secure admin authentication.

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- Redis/Valkey cache (AWS ElastiCache, Redis Cloud, or localhost)
- Sui wallet private key for faucet operations


### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd sui-faucet-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT="5001"
SUI_TESTNET_RPC="https://fullnode.testnet.sui.io:443"
FAUCET_WALLET_PRIVATE_KEY="suiprivkey********** replace with your private key"
CACHE_URL="create a redis or valkey cache from aws or you can use localhost"
DATABASE_URL='your postgres database url, neon.tech provides for free'
ADMIN_WALLETS="admin_wallet_public_address1,admin_wallet_public_address2"
JWT_SECRET="your jwt secret"
NODE_ENV="production"
```

4. **Set up database schema**

```bash
npx prisma migrate dev
```

This generates the Prisma client and applies database migrations.
5. **Run development server**

```bash
npm run dev
```

The API will be available at `http://localhost:5001`

## 🔧 Environment Configuration Guide

### Required Services Setup

#### 1. PostgreSQL Database (Free)

- Visit [neon.tech](https://neon.tech) and create a free account
- Create a new database project
- Copy the connection string to `DATABASE_URL`
- Format: `postgresql://username:password@hostname:5432/database_name`


#### 2. Redis/Valkey Cache

**Option A: AWS ElastiCache (Recommended for production)**

- Create ElastiCache Redis cluster in AWS Console
- Note the endpoint URL for `CACHE_URL`

**Option B: Redis Cloud (Free tier available)**

- Sign up at [Redis Cloud](https://redis.com/cloud/)
- Create a free database
- Use the provided endpoint for `CACHE_URL`

**Option C: Local Redis (Development only)**

- Install Redis locally: `brew install redis` (Mac) or `sudo apt-get install redis-server` (Linux)
- Set `CACHE_URL="localhost"`
- **Note**: Comment out TLS line for localhost (see Local Development section)


#### 3. JWT Secret Generation

Generate a secure JWT secret using your operating system:

**Linux/Mac:**

```bash
openssl rand -base64 32
```

**Windows (PowerShell):**

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

**Alternative (Node.js):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```


#### 4. Sui Wallet Setup

- Create a new Sui wallet or use existing testnet wallet
- Export the private key (starts with `suiprivkey`)
- **Security**: Keep this private key secure and never commit to version control
- Fund the wallet with testnet SUI tokens for faucet operations


#### 5. Admin Wallets Configuration

- Add trusted wallet addresses to `ADMIN_WALLETS`
- Format: `0x1234...abcd,0x5678...efgh` (comma-separated)
- **Important**: Only add wallets you control and trust
- These addresses will have admin dashboard access


### Environment Variables Breakdown

```env
# Server Configuration
PORT="5001"                                    # API server port
NODE_ENV="production"                          # Environment mode

# Sui Network Configuration  
SUI_TESTNET_RPC="https://fullnode.testnet.sui.io:443"  # Sui testnet RPC endpoint
FAUCET_WALLET_PRIVATE_KEY="suiprivkey..."     # Private key for token distribution

# External Services
CACHE_URL="your-redis-endpoint"                # Redis/Valkey cache endpoint
DATABASE_URL="postgresql://..."               # PostgreSQL connection string

# Security
JWT_SECRET="your-generated-jwt-secret"         # JWT signing secret
ADMIN_WALLETS="0x...,0x..."                  # Comma-separated admin addresses
```


## 🛠️ Local Development Setup

### Redis Configuration for Localhost

When running Redis locally, modify the rate limiter configuration:

**File**: `middlewares/ratelimiters.js` (or `.ts`)

```javascript
export const redisClient = new Redis({
  host: url,
  port: 6379,
  enableOfflineQueue: false,
  // tls: {},  // Comment out this line for localhost
});
```

**Why this is needed**: Local Redis doesn't use TLS encryption, while cloud providers typically do.

### Development vs Production

| Environment | Redis TLS | Database | JWT Secret | Admin Access |
| :-- | :-- | :-- | :-- | :-- |
| Development | Disabled | Local/Neon | Generated | Test wallets |
| Production | Enabled | Neon/AWS | Secure | Trusted only |

## 👨💼 Admin Dashboard Integration

### Cookie Configuration

For proper admin authentication, ensure:

1. **Same Root Domain**: Backend and frontend must be on the same root domain
    - ✅ Good: `api.yourfaucet.com` + `yourfaucet.com`
    - ❌ Bad: `api.herokuapp.com` + `yourfaucet.netlify.app`
2. **Cookie Settings**: The backend automatically configures secure cookie settings for production

### Admin Authentication Flow

1. Admin connects wallet on frontend (`/admin`)
2. Frontend requests challenge message from backend
3. Admin signs message with wallet
4. Backend verifies signature and issues JWT cookie
5. Subsequent requests use cookie for authentication

### Troubleshooting Admin Access

- **Cookie Issues**: Clear browser cookies for the site (refer to frontend documentation)
- **Wallet Not Recognized**: Verify wallet address is in `ADMIN_WALLETS`
- **Cross-Domain Issues**: Ensure backend and frontend share same root domain


## 🎯 Faucet Configuration

### Real-Time Configuration Updates

- **Immediate Effect**: New claimers get updated limits instantly
- **Existing Users**: Must wait for current cooldown timer to expire
- **Configuration Options**:
    - Faucet amount per request
    - Rate limits (per IP/wallet)
    - Cooldown periods
    - Enable/disable faucet


### Rate Limiting Strategy

The backend implements sophisticated rate limiting:

- **IP-based**: Prevents single IP abuse
- **Wallet-based**: Prevents single wallet spam
- **Conditional consumption**: Quotas only consumed on successful transfers
- **Redis persistence**: Limits survive server restarts


## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis/Valkey for rate limiting
- **Blockchain**: Sui SDK for testnet interactions
- **Security**: JWT authentication, wallet signature verification


### Key Components

```
├── routes/              # API endpoints
├── middlewares/         # Rate limiting, authentication
├── services/           # Business logic (faucet, admin)
├── utils/              # Configuration, helpers
├── prisma/             # Database schema and migrations
└── types/              # TypeScript type definitions
```


### API Endpoints

- `POST /api/faucet` - Request testnet tokens
- `POST /api/admin/auth` - Admin authentication
- `GET /api/admin/config` - Get faucet configuration
- `PUT /api/admin/config` - Update faucet settings
- `GET /api/admin/stats` - Usage statistics


## 🔒 Security Features

### Production Security

- **Private Key Protection**: Environment variable isolation
- **JWT Security**: Cryptographically secure tokens
- **Rate Limiting**: Multi-layer abuse prevention
- **Input Validation**: Zod schema validation
- **CORS Configuration**: Restricted to frontend domain


### Development Security

- **Local Overrides**: Safe defaults for development
- **Secret Generation**: Cryptographically secure JWT secrets
- **Test Wallets**: Separate admin wallets for testing


## 📊 Monitoring \& Analytics

### Database Tracking

- All faucet requests logged with status, timestamps, IP addresses
- Failed transactions tracked for debugging
- Admin actions audited for security


### Redis Monitoring

- Rate limit statistics
- Cache hit/miss ratios
- Connection health metrics


## 🚀 Deployment

### Environment Setup

1. **Production Database**: Use managed PostgreSQL (Neon, AWS RDS)
2. **Production Cache**: Use managed Redis (AWS ElastiCache, Redis Cloud)
3. **Environment Variables**: Configure in deployment platform
4. **Domain Configuration**: Ensure CORS settings match frontend domain

### Post-Deployment

1. Run database migrations: `npx prisma migrate deploy`
2. Verify environment variables are loaded
3. Test admin authentication flow
4. Monitor rate limiting functionality

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Test database connection
npx prisma db push
```

**Redis Connection Issues**

- Verify `CACHE_URL` format
- Check TLS configuration for cloud providers
- Ensure network connectivity

**Admin Authentication Problems**

- Verify wallet address in `ADMIN_WALLETS`
- Check JWT secret is properly set
- Clear browser cookies and retry

**Rate Limiting Not Working**

- Confirm Redis connection
- Check middleware order in routes
- Verify IP extraction logic


### Logs and Debugging

- Enable debug logging: `DEBUG=* npm run dev`
- Check Prisma query logs
- Monitor Redis operations
- Review JWT token validation


## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit a pull request

## 🔄 Updates and Maintenance

- **Database Migrations**: Use `npx prisma migrate dev` for schema changes
- **Dependency Updates**: Regular security updates recommended
- **Configuration Changes**: Admin dashboard provides real-time updates
- **Monitoring**: Set up alerts for rate limit violations and failed transactions

**Production Checklist:**

- [ ] Secure JWT secret generated
- [ ] Production database configured
- [ ] Redis cache operational
- [ ] Admin wallets verified
- [ ] CORS properly configured
- [ ] Rate limits tested
- [ ] Faucet wallet funded
- [ ] SSL/TLS enabled

<div style="text-align: center">⁂</div>

[^1]: https://fullnode.testnet.sui.io
