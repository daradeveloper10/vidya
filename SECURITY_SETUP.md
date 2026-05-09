# 🔒 Vidya Security Setup Guide

## ⚠️ CRITICAL: Your credentials are currently exposed in git history!

Your `.env` file was committed to the repository. Anyone with access to your git history can see all your API keys and secrets.

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Step 1: Rotate ALL Credentials

You must generate new credentials for everything. The old ones are compromised.

#### 1.1 Generate New Secrets

Run these commands to generate secure random secrets:

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET  
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### 1.2 Rotate Anthropic API Key

1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. **Delete the old key** (starts with `sk-ant-api03-ME-1kmEHWDi4Y6b...`)
4. Create a new API key
5. Copy the new key

#### 1.3 Rotate Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. **Delete the old credentials** (Client ID: `187094294833-evh3p76tge4tcjlmu2s2gti8ekc4s2e7...`)
5. Create new OAuth 2.0 credentials
6. Set authorized redirect URIs:
   - `https://vidya-server.onrender.com/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (for local dev)
7. Copy the new Client ID and Client Secret

#### 1.4 Change MongoDB Password

1. Go to MongoDB Atlas (https://cloud.mongodb.com/)
2. Navigate to Database Access
3. Find user `daradeveloper10`
4. **Change the password** (current: `RjBSxcne3XK25Wqf`)
5. Update your connection string with the new password

#### 1.5 Rotate YouTube API Key

1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services → Credentials
3. Find your API key
4. **Delete the old key** (starts with `AIzaSyCKy0yN0_cGPPTlWc6bia3cejU3XrLtJZ0`)
5. Create a new API key
6. Restrict it to YouTube Data API v3
7. Copy the new key

### Step 2: Update Your Local .env File

Edit `server/.env` with your NEW credentials:

```bash
ANTHROPIC_API_KEY=your_new_anthropic_key_here
GOOGLE_CLIENT_ID=your_new_google_client_id_here
GOOGLE_CLIENT_SECRET=your_new_google_client_secret_here
MONGODB_URI=mongodb+srv://daradeveloper10:YOUR_NEW_PASSWORD@vidya.553h54p.mongodb.net/vidya?appName=vidya
SESSION_SECRET=your_generated_session_secret_here
JWT_SECRET=your_generated_jwt_secret_here
YOUTUBE_API_KEY=your_new_youtube_key_here
CLIENT_URL=http://localhost:5173
```

### Step 3: Remove .env from Git History

The `.env` file is already committed. You need to remove it from git history:

**Option A: Using BFG Repo-Cleaner (Recommended)**

```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror https://github.com/daradeveloper10/vidya.git vidya-cleanup
cd vidya-cleanup

# Remove .env from history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history!)
git push --force
```

**Option B: Using git filter-branch**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

⚠️ **WARNING**: This rewrites git history. Coordinate with any collaborators!

### Step 4: Update Production Environment Variables

#### For Render (Backend)

1. Go to your Render dashboard
2. Select your Vidya server service
3. Go to Environment
4. Update ALL environment variables with your NEW credentials
5. Save changes (this will trigger a redeploy)

#### For Vercel (Frontend)

1. Go to your Vercel dashboard
2. Select your Vidya project
3. Go to Settings → Environment Variables
4. Update `VITE_API_URL` if needed
5. Redeploy your frontend

### Step 5: Verify Everything Works

1. Test local development:
   ```bash
   cd server
   npm start
   ```

2. Test Google OAuth login
3. Test curriculum generation (uses Anthropic API)
4. Test video search (uses YouTube API)
5. Check MongoDB connection

## 🛡️ Security Improvements Made

✅ Created `.env.example` template  
✅ Fixed error handling to not expose details in production  
✅ Updated CORS to use environment variable  
✅ Added JWT_SECRET to environment variables  
✅ Documented secure secret generation  

## 📋 Additional Security Recommendations

### Before Public Beta

- [ ] Set up monitoring/logging (e.g., Sentry)
- [ ] Add rate limiting per user (not just per IP)
- [ ] Implement input validation with express-validator
- [ ] Add CSRF protection for state-changing operations
- [ ] Set up MongoDB IP whitelist
- [ ] Add user data export/deletion (GDPR compliance)
- [ ] Set up automated security scanning (Snyk, Dependabot)
- [ ] Create incident response plan
- [ ] Set up backup strategy for MongoDB

### Production Checklist

- [ ] Set `NODE_ENV=production` in production
- [ ] Enable MongoDB connection encryption
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Enable security headers (already using Helmet)
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Set up health check monitoring
- [ ] Document API rate limits for users

## 🔐 Best Practices Going Forward

1. **Never commit secrets** - Always use environment variables
2. **Rotate credentials regularly** - Every 90 days minimum
3. **Use different credentials** for dev/staging/production
4. **Monitor API usage** - Watch for unusual patterns
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Review access logs** - Check for suspicious activity
7. **Backup your database** - Regular automated backups
8. **Test disaster recovery** - Practice restoring from backups

## 📞 Need Help?

If you encounter issues during credential rotation:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB IP whitelist includes your server's IP
4. Test each API integration individually

## ✅ Post-Setup Verification

After completing all steps, verify:
- [ ] Old credentials are deleted/rotated
- [ ] New credentials work in local development
- [ ] New credentials work in production
- [ ] `.env` is not in git history
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` is committed
- [ ] All team members have new credentials
- [ ] Production environment variables are updated
- [ ] Application works end-to-end

---

**Remember**: Security is an ongoing process, not a one-time setup. Stay vigilant!
