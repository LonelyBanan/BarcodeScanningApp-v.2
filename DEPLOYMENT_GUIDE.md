# Deployment Guide

To make this app installable on PC and Android, you need to deploy it to a web server with HTTPS.

## Quick Deploy Options

### Option 1: Vercel (Recommended - FREE)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project root:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: Y
   - Which scope: [your account]
   - Link to existing project: N
   - Project name: [default or custom]
   - Directory: ./
   - Override settings: N

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

6. **Your app is now live!**
   - You'll get a URL like: `https://your-app.vercel.app`
   - Share this URL to access from any PC or Android device

---

### Option 2: Netlify (FREE)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Build the app:**
   ```bash
   npm run build
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

5. **Your app is now live!**
   - You'll get a URL like: `https://your-app.netlify.app`

---

### Option 3: GitHub Pages (FREE)

1. **Install gh-pages:**
   ```bash
   npm install -D gh-pages
   ```

2. **Update package.json:**
   Add to scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. **Update vite.config.ts:**
   Add base URL:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages
   - Save

6. **Your app is live at:**
   `https://your-username.github.io/your-repo-name/`

---

### Option 4: Self-Hosted Server

If you have your own server with HTTPS:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to your web server

3. **Configure your web server** (Apache/Nginx) to serve the files

4. **Ensure HTTPS is enabled** (required for PWA features)

---

## After Deployment

### Test the Installation

1. **Open the deployed URL** on your PC or Android
2. **Look for the install prompt** at the bottom
3. **Click "Install"** to add to your device
4. **Grant permissions** when prompted (camera, location)

### Share with Team

Send the deployment URL to your team members:
- They can access it from any browser
- They can install it on their devices
- All data syncs via Google Sheets

---

## Important Notes

### HTTPS Requirement
- PWA features (install, offline, camera) **require HTTPS**
- All recommended services provide HTTPS automatically
- Local testing uses `localhost` which is also secure

### Camera Access
- Camera scanning works on:
  - ✅ Android Chrome/Samsung Internet
  - ✅ PC Chrome/Edge/Firefox
  - ❌ iOS Safari (limited support)

### Offline Mode
- After installation, the app caches:
  - All JavaScript and CSS files
  - UI components and icons
  - Previously loaded data
- Requires internet for:
  - Google Sheets sync
  - First-time data loading

---

## Local Development

To test locally before deploying:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

The install prompt won't appear in dev mode, but you can test:
- All functionality
- Theme switching
- Camera scanning (requires HTTPS or localhost)
- Data management

---

## Environment Variables (Optional)

If you need to configure API keys or URLs:

1. Create `.env` file:
   ```
   VITE_GOOGLE_SHEETS_API_KEY=your-key
   VITE_APP_URL=https://your-app.com
   ```

2. Access in code:
   ```typescript
   const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY
   ```

---

## Updating the Deployed App

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### GitHub Pages
```bash
npm run deploy
```

Users will automatically get the update when they next open the app.

---

## Custom Domain (Optional)

All platforms support custom domains:

1. **Purchase a domain** (e.g., inventory.yourcompany.com)
2. **Add to your deployment platform:**
   - Vercel: Settings → Domains
   - Netlify: Site settings → Domain management
   - GitHub: Settings → Pages → Custom domain
3. **Update DNS records** as instructed
4. **HTTPS is configured automatically**

---

## Troubleshooting

### Build fails
- Check Node.js version (16+ required)
- Run `npm install` again
- Delete `node_modules` and reinstall

### App doesn't install
- Ensure HTTPS is working
- Check browser console for errors
- Verify manifest.json is accessible

### Camera not working
- Must use HTTPS (not HTTP)
- Check browser permissions
- Test on supported browsers

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **GitHub Pages**: https://pages.github.com
- **Vite Docs**: https://vitejs.dev
- **PWA Guide**: https://web.dev/progressive-web-apps/
