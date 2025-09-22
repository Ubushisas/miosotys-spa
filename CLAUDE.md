# Claude Code Deployment Guide

## Quick GitHub Pages Deployment

When deploying spa websites to GitHub Pages:

### Setup
1. Create GitHub repo (public)
2. Upload all files via web interface
3. Settings → Pages → Deploy from branch → main → Save

### Common Issues & Fixes

**Missing Images:**
- Check if folders uploaded correctly
- Special characters in folder names (á, ñ) can cause issues
- Update file paths in code to match actual GitHub folder names

**Logo Issues:**
- Remove CSS filters: `filter: brightness(0) invert(1);`
- PNG transparency works when CSS is clean

**Catalog Images:**
- GitHub preserves folder names exactly as uploaded
- Match paths in JavaScript to actual folder structure
- Use browser dev tools to check 404 errors

### Quick Fix Workflow
1. Fix files locally
2. Upload via GitHub web interface (Add file → Upload files)
3. Wait 2-3 minutes for GitHub Pages refresh
4. Hard refresh browser (Cmd+Shift+R)

### File Structure
```
/Assets/          (fonts)
/Test_Images/     (all images)
  /Catálogo/      (package images)
  /Test2/         (hero images)
index.html
catalogo.html
styles.css
script.js
```

Claude should always:
- Give ONE solution at a time
- Test actual URLs before suggesting fixes
- Check GitHub folder structure vs code paths
- Use web interface when terminal auth fails