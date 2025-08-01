# Discord OAuth2 Setup Guide

## 🔗 **OAuth2 Callback Configuration**

### **1. Discord Developer Portal Setup**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2 → General**
4. Add redirect URLs:

**For Development:**
```
http://localhost:5001/auth/discord/callback
```

**For Production (VPS):**
```
https://your-domain.com/auth/discord/callback
# or
http://your-vps-ip:5001/auth/discord/callback
```

### **2. Environment Variables**

Add these to your `.env` file:

```env
# Discord OAuth2
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
BASE_URL=http://localhost:5001  # or https://your-domain.com
FRONTEND_URL=http://localhost:3000  # or https://your-frontend-domain.com
```

### **3. OAuth2 Flow**

1. **User clicks login** → `/auth/discord/login`
2. **Redirected to Discord** → User authorizes
3. **Discord redirects back** → `/auth/discord/callback`
4. **Server validates** → Checks roles, generates token
5. **Redirect to frontend** → With token or error

### **4. Usage**

**Login URL:**
```
http://your-vps-ip:5001/auth/discord/login
```

**Callback URL (configure in Discord):**
```
http://your-vps-ip:5001/auth/discord/callback
```

### **5. Security Considerations**

- ✅ Use HTTPS in production
- ✅ Validate redirect URIs
- ✅ Check user roles before granting access
- ✅ Use secure session tokens
- ✅ Implement CSRF protection

### **6. Testing**

1. Start your server: `npm run dev`
2. Visit: `http://localhost:5001/auth/discord/login`
3. Complete Discord authorization
4. Should redirect to frontend with token

### **7. Production Deployment**

When deploying to VPS:

1. **Update Discord redirects** to your domain/IP
2. **Set environment variables** with production URLs
3. **Configure reverse proxy** (Nginx) if needed
4. **Enable HTTPS** for security

### **8. Troubleshooting**

**Common Issues:**
- ❌ "Invalid redirect URI" → Check Discord portal settings
- ❌ "Client ID not found" → Verify environment variables
- ❌ "User not in guild" → Check guild ID and bot permissions
- ❌ "Insufficient permissions" → Verify role IDs

**Debug Steps:**
1. Check server logs for OAuth errors
2. Verify all environment variables are set
3. Test with Discord's OAuth2 debugger
4. Ensure bot has proper guild permissions 