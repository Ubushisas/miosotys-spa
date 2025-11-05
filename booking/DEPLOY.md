# 🚀 Deployment Guide

## Quick Deploy (Recommended)

Every time you want to deploy changes to production:

```bash
cd /Users/lis/miosotys-spa/booking
bash deploy.sh
```

That's it! The script will:
1. Build your app
2. Deploy to Vercel
3. Update the live URL (https://booking-beryl-eta.vercel.app)
4. Tell you when it's ready

**Wait 30 seconds** after deployment, then **hard refresh** your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows).

---

## Full Workflow

### 1. Make your changes
Edit any files in the booking project

### 2. Commit to Git (optional but recommended)
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### 3. Deploy
```bash
bash deploy.sh
```

### 4. Test
Go to https://spamyosotis.com/catalogo.html, click "Agendar", and you'll see your changes!

---

## Troubleshooting

### Changes not showing up?
1. Wait 30 seconds after deployment
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
3. Clear browser cache if still not working

### Deployment failed?
1. Make sure you're in the booking directory
2. Check you're logged into Vercel: `vercel whoami`
3. Re-link the project: `vercel link --yes`

### Need to check deployment logs?
```bash
vercel ls  # See recent deployments
vercel inspect [DEPLOYMENT-URL] --logs  # View logs
```

---

## What the Script Does

The `deploy.sh` script:
- Changes to the correct directory
- Temporarily hides .git folder (to avoid permission issues)
- Deploys to Vercel production
- Updates the alias to booking-beryl-eta.vercel.app
- Restores .git folder

This ensures your iframe at https://booking-beryl-eta.vercel.app always shows the latest version!
