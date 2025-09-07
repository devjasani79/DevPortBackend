# DevPort Backend - Logistics SaaS API

A comprehensive backend API for a logistics SaaS platform built with Express.js, Node.js, and Supabase.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with Supabase integration
- **Role-Based Access Control** - Customer, Shipper, Admin, and Superadmin roles
- **Shipment Management** - Complete shipment lifecycle from request to delivery
- **Quotation System** - Shippers can bid on shipment requests
- **Profile Management** - Separate profiles for customers and shippers
- **Real-time Updates** - Supabase real-time subscriptions

## 🏗️ Architecture

```
├── config/          # Database and external service configurations
├── controllers/     # Business logic and request handlers
├── middleware/      # Authentication, authorization, and error handling
├── routes/          # API endpoint definitions
├── utils/           # Helper functions and constants
└── server.js        # Main application entry point
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- PostgreSQL database (handled by Supabase)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DevPortBackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # JWT Configuration (fallback)
   JWT_SECRET=your_jwt_secret_key_here
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```

4. **Database Setup**
   Ensure your Supabase project has the following tables:
   - `profiles` - User profile information
   - `customers` - Customer company details
   - `shippers` - Shipper company details
   - `shipment_requests` - Customer shipment requests
   - `quotations` - Shipper quotations for requests
   - `shipments` - Actual shipments (created when quotation accepted)

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🗄️ Database Schema

### Core Tables

- **profiles**: User authentication and basic profile data
- **customers**: Customer company information and contact details
- **shippers**: Shipper company information, licenses, and supported modes
- **shipment_requests**: Customer shipment requirements
- **quotations**: Shipper bids on shipment requests
- **shipments**: Actual shipments created from accepted quotations

### Key Relationships

- `profiles.user_id` → Supabase auth.users.id
- `customers.user_id` → profiles.id
- `shippers.user_id` → profiles.id
- `shipment_requests.customer_id` → customers.id
- `quotations.shipment_request_id` → shipment_requests.id
- `quotations.shipper_id` → shippers.id
- `shipments.quotation_id` → quotations.id

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update current user
- `DELETE /api/auth/me` - Delete current user

### Profiles
- `GET /api/profiles` - Get all profiles (Admin/Superadmin)
- `GET /api/profiles/:id` - Get profile by ID

### Customers
- `GET /api/customers` - Get all customers (Admin/Superadmin)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer profile
- `PUT /api/customers/:id` - Update customer profile
- `DELETE /api/customers/:id` - Delete customer (Admin/Superadmin)

### Shippers
- `POST /api/shippers` - Register as shipper
- `GET /api/shippers` - Get all shippers (Admin/Superadmin)
- `GET /api/shippers/:id` - Get shipper by ID
- `PUT /api/shippers/:id` - Update shipper profile

### Shipment Requests
- `POST /api/shipments/requests` - Create shipment request (Customer)
- `GET /api/shipments/requests` - Get all requests (Admin/Superadmin)
- `GET /api/shipments/requests/:id` - Get request by ID
- `PATCH /api/shipments/requests/:id/status` - Update request status

### Quotations
- `POST /api/quotations` - Create quotation (Shipper)
- `GET /api/quotations` - Get all quotations (Admin/Superadmin)
- `GET /api/quotations/:id` - Get quotation by ID
- `PATCH /api/quotations/:id/status` - Update quotation status

### Shipments
- `POST /api/shipments` - Create shipment (Admin/Superadmin)
- `GET /api/shipments` - Get all shipments (Admin/Superadmin)
- `GET /api/shipments/:id` - Get shipment by ID
- `PATCH /api/shipments/:id/status` - Update shipment status

## 🛡️ Security Features

- **JWT Authentication** with Supabase integration
- **Role-Based Access Control** (RBAC)
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **Error Handling** with proper HTTP status codes
- **Rate Limiting** (can be added)

## 🔄 Workflow

1. **Customer Registration** → Creates profile and customer record
2. **Shipment Request** → Customer submits shipment requirements
3. **Quotation Process** → Shippers bid on requests
4. **Quotation Acceptance** → Customer accepts a quotation
5. **Shipment Creation** → Admin creates actual shipment
6. **Tracking** → Monitor shipment progress

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `JWT_SECRET` | JWT signing secret | No | devsecret |
| `CORS_ORIGIN` | Allowed CORS origins | No | localhost:3000 |

## 🚀 Deployment

### Render Deployment

1. **Fork/Clone this repository**
   ```bash
   git clone <your-repo-url>
   cd DevPortBackend
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

3. **Configure the service**
   - **Name**: `devport-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose based on your needs (Free tier available)

4. **Set Environment Variables in Render**
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=https://your-frontend-domain.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your API will be available at `https://your-app-name.onrender.com`

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Health Check

Once deployed, you can check the health of your API:
- **Health Check**: `GET /health`
- **API Status**: `GET /`

### Environment Variables Reference

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] File upload for documents
- [ ] Advanced search and filtering
- [ ] Analytics and reporting
- [ ] Mobile app API endpoints
- [ ] Webhook integrations
- [ ] Multi-language support 