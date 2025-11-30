# Railway Deployment Guide - DRGxCoder

Complete guide to deploy both backend and frontend to Railway.

---

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Repository**: Push your code to GitHub
3. **Railway CLI** (optional): `npm install -g @railway/cli`

---

## Part 1: Backend Deployment (FastAPI + PostgreSQL)

### Step 1: Create New Project on Railway

1. Go to https://railway.app/new
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your repository: `DRGxCoder`

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Note: The `DATABASE_URL` environment variable is automatically set

### Step 3: Configure Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo again
2. Railway will detect it's a Python project
3. Click on the service → **"Settings"**

#### Configure Build & Deploy:

**Root Directory:**
```
backend
```

**Build & Start Commands:**

Railway will automatically use the `nixpacks.toml` configuration file in the `backend/` directory. No need to manually configure build/start commands!

The `nixpacks.toml` file handles:
- Installing dependencies with `uv`
- Generating Prisma client
- Fetching Prisma engine binary
- Starting the uvicorn server

If Railway doesn't detect it, manually set:

**Build Command:**
```bash
prisma generate && prisma py fetch
```

**Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Watch Paths:**
```
backend/**
```

#### Add Environment Variables:

Click **"Variables"** tab and add:

```bash
# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Google AI (required)
GOOGLE_API_KEY=your_google_api_key_here

# CORS (set to your frontend URL after frontend deployment)
FRONTEND_URL=https://your-frontend.up.railway.app
```

### Step 4: Run Database Migrations

1. After first deployment, open Railway service
2. Click **"Deployments"** → Click latest deployment
3. Click **"View Logs"**
4. You'll need to run migrations manually

**Option A: Using Railway CLI**
```bash
railway login
railway link
railway run prisma db push
```

**Option B: Using Railway Shell (in dashboard)**
1. In service settings, enable **"Shell"**
2. Open shell and run:
```bash
cd backend
prisma db push
```

### Step 5: Populate Diagnosis Codes

After migrations, populate the diagnosis codes table:

```bash
# Using Railway CLI
railway run python -c "
import asyncio
from app.database import populate_diagnosis_codes
asyncio.run(populate_diagnosis_codes())
"
```

Or create a temporary endpoint in your FastAPI app:
```python
@app.post("/admin/populate-codes")
async def populate_codes_endpoint():
    from app.database import populate_diagnosis_codes
    await populate_diagnosis_codes()
    return {"status": "success"}
```

Then call it once: `curl -X POST https://your-backend.railway.app/admin/populate-codes`

**Remember to remove this endpoint after use!**

---

## Part 2: Frontend Deployment (Next.js)

### Step 1: Create Frontend Service

1. In same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Railway will create a new service

### Step 2: Configure Frontend Service

Click on frontend service → **"Settings"**

**Root Directory:**
```
frontend
```

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Watch Paths:**
```
frontend/**
```

### Step 3: Add Environment Variables

Click **"Variables"** tab:

```bash
# Backend API URL (use Railway backend service URL)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Node environment
NODE_ENV=production
```

### Step 4: Update Backend CORS

1. Go back to backend service
2. Update `FRONTEND_URL` environment variable with your actual frontend URL:
```bash
FRONTEND_URL=https://your-frontend.railway.app
```

3. Backend will auto-redeploy

---

## Part 3: Post-Deployment Configuration

### Update Backend CORS Settings

Verify `backend/app/main.py` has correct CORS:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://*.railway.app",  # Allow all Railway domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Generate Custom Domains (Optional)

1. **Backend**: In Railway backend service → **"Settings"** → **"Domains"**
   - Click **"Generate Domain"** or add custom domain
   
2. **Frontend**: In Railway frontend service → **"Settings"** → **"Domains"**
   - Click **"Generate Domain"** or add custom domain

3. Update environment variables with new domains if changed

---

## Part 4: Verification Checklist

### Backend Verification:

✅ Visit `https://your-backend.railway.app/docs` - Should see FastAPI Swagger UI  
✅ Check `/health` endpoint  
✅ Verify database connection  
✅ Test `/api/diagnosis-codes/search?query=A00` endpoint  

### Frontend Verification:

✅ Visit `https://your-frontend.railway.app`  
✅ Open browser console - check for CORS errors  
✅ Test "New Prediction" button  
✅ Verify API calls work  

---

## Common Issues & Solutions

### Issue 1: "Module not found: prisma"

**Solution:** Make sure build command includes `prisma generate`:
```bash
pip install -r requirements.txt && prisma generate
```

### Issue 2: Database connection fails

**Solution:** Verify `DATABASE_URL` is set correctly:
1. Check PostgreSQL service is running
2. Verify variable reference: `${{Postgres.DATABASE_URL}}`
3. Check logs for connection errors

### Issue 3: CORS errors in frontend

**Solution:**
1. Verify `FRONTEND_URL` in backend includes correct protocol (https://)
2. Check `NEXT_PUBLIC_API_URL` in frontend is correct
3. Ensure backend CORS middleware includes Railway domains

### Issue 4: Frontend can't connect to backend

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` environment variable is set
2. Check backend service is running (green status)
3. Test backend URL directly in browser: `https://your-backend.railway.app/docs`

### Issue 5: Build fails with memory errors

**Solution:** Upgrade Railway plan or optimize build:
1. In service settings, increase memory allocation
2. Consider using Railway Pro plan for more resources

### Issue 6: Diagnosis codes table is empty

**Solution:** Run the population script:
```bash
railway run python scripts/populate_codes.py
```

Or use the temporary admin endpoint mentioned in Step 5.

---

## Environment Variables Summary

### Backend Required Variables:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-set by Railway
GOOGLE_API_KEY=your_api_key              # Required for AI
FRONTEND_URL=https://your-frontend.railway.app  # For CORS
```

### Frontend Required Variables:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

---

## Monitoring & Logs

### View Logs:
1. Click on service in Railway dashboard
2. Click **"Deployments"** tab
3. Click on latest deployment
4. Click **"View Logs"**

### Monitor Resources:
1. Click on service
2. View **"Metrics"** tab
3. Check CPU, Memory, Network usage

---

## Updating Deployment

### Auto-Deploy on Git Push:
Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will detect changes and redeploy affected services.

### Manual Redeploy:
1. Go to service in Railway dashboard
2. Click **"Deployments"**
3. Click **"⋮"** (three dots) on latest deployment
4. Click **"Redeploy"**

---

## Cost Estimation

**Railway Pricing (as of 2024):**
- **Starter Plan**: $5/month per service
- **Database**: $5/month
- **Total Estimated**: ~$15/month (2 services + 1 database)

**Free Tier:**
- Railway offers $5 free credit per month
- Good for testing, may not be enough for production

---

## Security Best Practices

### 1. Secure Environment Variables:
- Never commit `.env` files
- Use Railway's encrypted variable storage
- Rotate API keys regularly

### 2. Database Security:
- Railway PostgreSQL is private by default
- Only accessible from your Railway services
- No public IP exposed

### 3. CORS Configuration:
- Only allow specific frontend domains
- Avoid using `allow_origins=["*"]` in production

### 4. API Key Management:
- Store `GOOGLE_API_KEY` only in Railway variables
- Don't expose in frontend code
- Monitor API usage in Google Console

---

## Backup Strategy

### Database Backups:

Railway doesn't provide automatic backups on starter plan. Consider:

**Option 1: Manual Backups**
```bash
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Option 2: Scheduled Backups with GitHub Actions**

Create `.github/workflows/backup.yml`:
```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          # Add backup script here
```

**Option 3: Upgrade to Railway Pro**
- Includes automated daily backups
- Point-in-time recovery
- Better for production

---

## Rollback Procedure

### If deployment fails:

1. Go to Railway service
2. Click **"Deployments"**
3. Find last working deployment
4. Click **"⋮"** → **"Redeploy"**

### If database migration fails:

1. Connect to database via Railway shell
2. Run rollback migration manually
3. Verify database state
4. Redeploy backend

---

## Performance Optimization

### Backend:
1. **Use connection pooling** (already configured in Prisma)
2. **Enable caching** for diagnosis codes
3. **Optimize database queries** with indexes
4. **Monitor slow queries** in logs

### Frontend:
1. **Enable Next.js caching**
2. **Optimize images** with Next.js Image component
3. **Use CDN** for static assets (Railway includes this)
4. **Enable compression** (automatic in production)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Your Project Dashboard**: https://railway.app/dashboard

---

## Quick Deploy Checklist

- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Add PostgreSQL database
- [ ] Deploy backend service
- [ ] Configure backend environment variables
- [ ] Run database migrations
- [ ] Populate diagnosis codes
- [ ] Deploy frontend service
- [ ] Configure frontend environment variables
- [ ] Update backend CORS with frontend URL
- [ ] Test backend API endpoints
- [ ] Test frontend application
- [ ] Monitor logs for errors
- [ ] Set up custom domains (optional)
- [ ] Configure backups (recommended)

---

## Contact & Troubleshooting

If you encounter issues:

1. **Check Railway Status**: https://status.railway.app
2. **Review Logs**: Service → Deployments → View Logs
3. **Railway Discord**: Ask in #help channel
4. **Railway Support**: support@railway.app

---

**🚀 You're ready to deploy! Follow the steps above and your DRGxCoder will be live in ~30 minutes.**

**Good luck with your deployment!** 🎉
