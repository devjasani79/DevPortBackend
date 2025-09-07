# 🚀 DevPort Backend Startup Guide

## Quick Start

### 1. Environment Setup
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# JWT Configuration (optional, has default)
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Run the SQL schema in your Supabase SQL editor:
```bash
# Copy and paste the contents of database/schema.sql into your Supabase SQL editor
# This will create all necessary tables and relationships
```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Test the API
```bash
# Run the test script
node test-api.js
```

## 🔧 Database Schema Notes

### Missing Tables
Your current database is missing the `shipments` table. The complete schema includes:

- ✅ `profiles` - User profiles
- ✅ `customers` - Customer companies  
- ✅ `shippers` - Shipper companies
- ✅ `shipment_requests` - Customer requests
- ✅ `quotations` - Shipper bids
- ❌ `shipments` - Actual shipments (needs to be created)

### Key Relationships Fixed
- `customers.user_id` → `profiles.id` (not directly to auth.users)
- `shippers.user_id` → `profiles.id` (not directly to auth.users)
- `shipments.quotation_id` → `quotations.id` (new relationship)

## 🛠️ What Was Fixed

### 1. **Missing Routes Connected**
- ✅ Added quotation routes to server.js
- ✅ Fixed shipment routes structure
- ✅ Proper API endpoint organization

### 2. **Controller Logic Fixed**
- ✅ Fixed customer_id relationship handling
- ✅ Fixed shipper_id relationship handling
- ✅ Added proper access control
- ✅ Added missing CRUD operations

### 3. **Database Relationships**
- ✅ Proper foreign key relationships
- ✅ Consistent user_id references
- ✅ Added missing shipments table

### 4. **Security & Access Control**
- ✅ Role-based middleware
- ✅ Proper authentication checks
- ✅ Owner-only access to profiles
- ✅ Admin-only access to sensitive operations

### 5. **Error Handling**
- ✅ Consistent error response format
- ✅ Proper HTTP status codes
- ✅ Input validation

## 📋 API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| `GET` | `/` | Public | Health check |
| `POST` | `/api/auth/register` | Public | User registration |
| `POST` | `/api/auth/login` | Public | User login |
| `GET` | `/api/auth/me` | Auth | Current user |
| `GET` | `/api/profiles` | Admin+ | All profiles |
| `GET` | `/api/profiles/:id` | Owner/Admin | Profile by ID |
| `POST` | `/api/profiles` | Auth | Create/update profile |
| `GET` | `/api/customers` | Admin+ | All customers |
| `POST` | `/api/customers` | Auth | Create customer profile |
| `GET` | `/api/shippers` | Admin+ | All shippers |
| `POST` | `/api/shippers` | Customer | Register as shipper |
| `POST` | `/api/shipments/requests` | Customer | Create shipment request |
| `GET` | `/api/shipments/requests` | Admin+ | All shipment requests |
| `POST` | `/api/quotations` | Shipper | Create quotation |
| `GET` | `/api/quotations` | Admin+ | All quotations |
| `POST` | `/api/shipments` | Admin+ | Create shipment |
| `GET` | `/api/shipments` | Admin+ | All shipments |

## 🚨 Common Issues & Solutions

### 1. **Supabase Connection Failed**
- Check your `.env` file has correct Supabase credentials
- Ensure your Supabase project is active
- Verify the service role key has proper permissions

### 2. **Database Tables Missing**
- Run the complete schema from `database/schema.sql`
- Check that all tables were created successfully
- Verify foreign key relationships

### 3. **Authentication Errors**
- Ensure JWT_SECRET is set in `.env`
- Check that Supabase auth is properly configured
- Verify user roles are set correctly

### 4. **CORS Errors**
- Check `CORS_ORIGIN` in `.env` includes your frontend URL
- Ensure frontend is running on the specified port

## 🔄 Next Steps

1. **Test the API** with the provided test script
2. **Connect your frontend** to these endpoints
3. **Set up real authentication** flow
4. **Add input validation** middleware
5. **Implement file uploads** for documents
6. **Add real-time notifications** with Supabase subscriptions

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your `.env` configuration
3. Ensure database schema is properly set up
4. Test individual endpoints with Postman/Insomnia

## 🎯 Success Indicators

✅ Server starts without errors  
✅ Database connection successful  
✅ All API endpoints respond (even with auth errors)  
✅ Frontend can connect to backend  
✅ User registration/login works  
✅ CRUD operations function properly  

---

**Happy coding! 🚀** 