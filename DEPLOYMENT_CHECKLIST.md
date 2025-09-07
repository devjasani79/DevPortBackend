# 🚀 Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Copy `env.example` to `.env` and fill in all required values
- [ ] Verify all environment variables are set correctly
- [ ] Test database connection with provided credentials
- [ ] Ensure CORS_ORIGIN includes your frontend domain(s)

### ✅ Security Review
- [ ] Change default JWT_SECRET to a strong, random value
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY has appropriate permissions
- [ ] Review CORS_ORIGIN settings for production domains only
- [ ] Ensure no sensitive data is committed to version control

### ✅ Database Setup
- [ ] Run database migrations from `database/` folder
- [ ] Verify all required tables exist
- [ ] Test database connectivity from production environment
- [ ] Set up database backups (if using external PostgreSQL)

### ✅ Testing
- [ ] Run `npm test` to ensure all tests pass
- [ ] Test API endpoints with `npm run test:api`
- [ ] Verify health check endpoint works: `GET /health`
- [ ] Test authentication flow end-to-end

## Render Deployment Steps

### 1. Repository Setup
- [ ] Push code to GitHub repository
- [ ] Ensure all files are committed and pushed
- [ ] Verify `.gitignore` excludes sensitive files

### 2. Render Service Configuration
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Choose appropriate plan (Free tier available)

### 3. Environment Variables
Set these in Render dashboard:
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_strong_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Deployment
- [ ] Click "Create Web Service"
- [ ] Monitor build logs for any errors
- [ ] Wait for deployment to complete
- [ ] Test the deployed API

## Post-Deployment Verification

### ✅ Health Checks
- [ ] Test root endpoint: `GET https://your-app.onrender.com/`
- [ ] Test health endpoint: `GET https://your-app.onrender.com/health`
- [ ] Verify database connectivity in health response

### ✅ API Testing
- [ ] Test authentication endpoints
- [ ] Test protected endpoints with valid tokens
- [ ] Verify CORS is working with frontend
- [ ] Test rate limiting functionality

### ✅ Monitoring
- [ ] Set up monitoring/alerting (optional)
- [ ] Monitor application logs
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry, etc.)

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Verify Supabase credentials and network access
3. **CORS Errors**: Update CORS_ORIGIN with correct frontend URL
4. **Rate Limiting**: Adjust RATE_LIMIT_* variables if needed

### Useful Commands
```bash
# Test locally with production environment
NODE_ENV=production npm start

# Check health locally
curl http://localhost:5000/health

# Test API endpoints
npm run test:api
```

## Security Reminders

- [ ] Never commit `.env` files
- [ ] Use strong, unique secrets for production
- [ ] Regularly rotate API keys and secrets
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Review and audit access logs regularly

## Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Review this checklist
5. Check GitHub issues or create a new one
