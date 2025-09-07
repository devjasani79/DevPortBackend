# DevPort Backend - Complete Workflow Documentation

## 🚀 Fixed Workflow Process

The system now implements the complete workflow as requested:

### **1. Customer Creates Shipment Request**
- **Endpoint**: `POST /api/shipments/requests`
- **Access**: Customer only
- **Status**: `pending`
- **Description**: Customer submits shipment requirements

### **2. Admin Sends Request to Shippers**
- **Endpoint**: `PATCH /api/shipments/requests/:id/send-to-shippers`
- **Access**: Admin/Superadmin only
- **Status**: `sent_to_shippers`
- **Description**: Admin reviews and sends request to available shippers

### **3. Shippers Submit Quotations**
- **Endpoint**: `POST /api/quotations`
- **Access**: Shipper only
- **Status**: `pending` (quotation), `quotations_received` (request)
- **Description**: Shippers bid on the shipment request

### **4. Admin Selects Best Quotation**
- **Endpoint**: `PATCH /api/shipments/requests/:id/select-quotation`
- **Access**: Admin/Superadmin only
- **Status**: `quotation_selected` (request), `admin_selected` (quotation)
- **Description**: Admin reviews all quotations and selects the best one

### **5. Customer Approves/Rejects Admin's Selection**
- **Approve**: `PATCH /api/shipments/requests/:id/approve-quotation`
- **Reject**: `PATCH /api/shipments/requests/:id/reject-quotation`
- **Access**: Customer only
- **Status**: `customer_approved` (if approved), `quotations_received` (if rejected)
- **Description**: Customer reviews admin's selection and approves or rejects

### **6. Admin Creates Shipment (Order Management)**
- **Endpoint**: `POST /api/shipments`
- **Access**: Admin/Superadmin only
- **Status**: `quotation_accepted` (request), `accepted` (quotation), `in_transit` (shipment)
- **Description**: Admin creates actual shipment and order management begins

## 📊 Status Flow Diagram

```
Customer Request → Admin Review → Shipper Bidding → Admin Selection → Customer Approval → Order Management
     ↓                ↓              ↓                ↓                ↓                ↓
  pending      sent_to_shippers  quotations_received  quotation_selected  customer_approved  quotation_accepted
```

## 🔧 Database Schema Updates

### **New Status Values**

#### Shipment Requests:
- `pending` - Customer created, waiting for admin
- `sent_to_shippers` - Admin sent to shippers
- `quotations_received` - Shippers submitted quotations
- `quotation_selected` - Admin selected a quotation
- `customer_approved` - Customer approved admin's selection
- `quotation_accepted` - Final acceptance
- `cancelled` - Cancelled at any stage

#### Quotations:
- `pending` - Shipper submitted
- `admin_selected` - Admin selected this quotation
- `customer_approved` - Customer approved admin's selection
- `accepted` - Final acceptance
- `rejected` - Rejected by admin or customer
- `expired` - Expired

### **New Fields Added**
- `admin_notes` - Admin notes when sending to shippers
- `selected_quotation_id` - Which quotation admin selected
- `customer_approval_notes` - Customer approval notes
- `admin_selection_notes` - Why admin selected this quotation
- `customer_approval_notes` - Customer approval notes

## 🛠️ API Endpoints

### **Shipment Requests**
```
POST   /api/shipments/requests                    # Customer creates request
GET    /api/shipments/requests                    # Admin views all requests
GET    /api/shipments/requests/:id                # View specific request
PATCH  /api/shipments/requests/:id/send-to-shippers    # Admin sends to shippers
PATCH  /api/shipments/requests/:id/select-quotation    # Admin selects quotation
PATCH  /api/shipments/requests/:id/approve-quotation   # Customer approves
PATCH  /api/shipments/requests/:id/reject-quotation    # Customer rejects
PATCH  /api/shipments/requests/:id/status              # Legacy status update
```

### **Quotations**
```
POST   /api/quotations                            # Shipper creates quotation
GET    /api/quotations                            # Admin views all quotations
GET    /api/quotations/request/:requestId         # Get quotations for request
GET    /api/quotations/:id                        # View specific quotation
PATCH  /api/quotations/:id/status                 # Admin updates status
```

### **Shipments**
```
POST   /api/shipments                             # Admin creates shipment
GET    /api/shipments                             # Admin views all shipments
GET    /api/shipments/:id                         # View specific shipment
PATCH  /api/shipments/:id/status                  # Admin updates status
```

## 🔐 Access Control

### **Customer Access**
- Create shipment requests
- View own shipment requests
- Approve/reject admin's quotation selection
- View quotations for own requests

### **Shipper Access**
- Create quotations for requests sent to shippers
- View own quotations
- View shipment requests they can bid on

### **Admin/Superadmin Access**
- View all data
- Send requests to shippers
- Select quotations
- Create shipments
- Update all statuses

## 🚨 Error Handling

### **Foreign Key Constraint Fixed**
- Fixed `profiles` table to reference `auth.users(id)` directly
- Updated all foreign key relationships
- Created migration scripts for existing data

### **Status Validation**
- Each endpoint validates current status before allowing transitions
- Proper error messages for invalid status transitions
- Access control for each workflow step

## 📝 Usage Examples

### **Complete Workflow Example**

1. **Customer creates request:**
```bash
POST /api/shipments/requests
{
  "origin": "New York",
  "destination": "Los Angeles",
  "cargo_type": "Electronics",
  "weight": 1000,
  "volume": 50
}
```

2. **Admin sends to shippers:**
```bash
PATCH /api/shipments/requests/{id}/send-to-shippers
{
  "admin_notes": "High priority shipment, please provide competitive quotes"
}
```

3. **Shipper creates quotation:**
```bash
POST /api/quotations
{
  "shipment_request_id": "request-id",
  "price": 5000,
  "estimated_delivery_days": 7,
  "valid_until": "2024-01-15"
}
```

4. **Admin selects quotation:**
```bash
PATCH /api/shipments/requests/{id}/select-quotation
{
  "quotation_id": "quotation-id",
  "admin_selection_notes": "Best price and delivery time"
}
```

5. **Customer approves:**
```bash
PATCH /api/shipments/requests/{id}/approve-quotation
{
  "customer_approval_notes": "Approved, please proceed"
}
```

6. **Admin creates shipment:**
```bash
POST /api/shipments
{
  "quotation_id": "quotation-id",
  "tracking_number": "TRK123456789"
}
```

## 🔄 Migration Instructions

1. **Run the database migration:**
   - Copy contents of `database/workflow_fix.sql`
   - Paste into Supabase SQL editor
   - Execute the migration

2. **Test the workflow:**
   - Use the provided API endpoints
   - Follow the complete workflow example
   - Verify status transitions work correctly

## ✅ What Was Fixed

1. **Database Schema**: Fixed foreign key constraints and added new workflow fields
2. **Status Management**: Implemented proper status flow throughout the system
3. **Admin Workflow**: Added admin steps for sending requests and selecting quotations
4. **Customer Approval**: Added customer approval/rejection workflow
5. **API Endpoints**: Created all necessary endpoints for the complete workflow
6. **Access Control**: Proper role-based access for each workflow step
7. **Error Handling**: Comprehensive error handling and validation

The system now fully implements the requested workflow: Customer → Admin → Shippers → Admin → Customer → Order Management.

