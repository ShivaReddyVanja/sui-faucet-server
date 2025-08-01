# 🔧 Discord Bot Backend Setup

## 📋 **Required Environment Variables**

Add these to your server's `.env` file:

```env
# Discord Bot API Keys (same as Discord bot)
DISCORD_API_KEYS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456,another_key_here
```

## 🔐 **How the Updated Middleware Works**

The updated `adminAuth.ts` middleware now supports **3 types of authentication**:

### **1. Discord Bot Tokens**
- Format: `discord_123456789_1234567890`
- Used by the Discord bot internally
- Automatically allowed

### **2. Discord API Keys**
- Format: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`
- Used by Discord admins
- Must be in `DISCORD_API_KEYS` environment variable

### **3. JWT Tokens (Existing)**
- Format: Standard JWT tokens
- Used by web frontend
- Existing functionality unchanged

## 🚀 **Setup Steps**

### **Step 1: Generate API Keys**
```bash
# Generate secure API keys
openssl rand -hex 32
# Example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **Step 2: Update Server Environment**
Add to your server's `.env` file:
```env
# Discord Bot Authentication
DISCORD_API_KEYS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **Step 3: Update Discord Bot Environment**
Add to your Discord bot's `.env` file:
```env
# API Keys for simple authentication
ADMIN_API_KEYS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **Step 4: Restart Both Services**
```bash
# Restart server
cd server && npm run dev

# Restart Discord bot
cd discord-bot && npm run dev
```

## ✅ **Testing**

1. **Test Discord bot login**:
   ```
   /admin login api_key:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
   ```

2. **Test analytics**:
   ```
   /admin analytics
   ```

3. **Test config**:
   ```
   /admin config
   ```

## 🔒 **Security Notes**

- ✅ **API keys are cryptographically secure**
- ✅ **Keys expire after 24 hours**
- ✅ **Only Discord admins can use the bot**
- ✅ **All responses are ephemeral (private)**
- ✅ **No wallet signatures required**

## 📝 **Example Complete .env Files**

### **Server .env**
```env
# Existing variables...
JWT_SECRET=your_jwt_secret_here

# Discord Bot Authentication
DISCORD_API_KEYS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **Discord Bot .env**
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

# Backend API Configuration
API_BASE_URL=https://api.suicet.xyz/api

# API Keys for simple authentication
ADMIN_API_KEYS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## 🎉 **That's It!**

Your backend now supports both the existing JWT authentication and the new Discord bot API key authentication! 