exports.constants = {
  // HTTP Status Codes
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
  
  // Shipment Statuses
  SHIPMENT_STATUSES: {
    PENDING: "pending",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    DELAYED: "delayed"
  },
  
  // Shipment Request Statuses
  REQUEST_STATUSES: {
    PENDING: "pending",
    SENT_TO_SHIPPERS: "sent_to_shippers",
    QUOTATIONS_RECEIVED: "quotations_received",
    QUOTATION_SELECTED: "quotation_selected",
    CUSTOMER_APPROVED: "customer_approved",
    QUOTATION_ACCEPTED: "quotation_accepted",
    CANCELLED: "cancelled"
  },
  
  // Quotation Statuses
  QUOTATION_STATUSES: {
    PENDING: "pending",
    ADMIN_SELECTED: "admin_selected",
    CUSTOMER_APPROVED: "customer_approved",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    EXPIRED: "expired"
  },
  
  // User Roles
  USER_ROLES: {
    CUSTOMER: "customer",
    SHIPPER: "shipper",
    ADMIN: "admin",
    SUPERADMIN: "superadmin"
  },
  
  // Shipper Statuses
  SHIPPER_STATUSES: {
    PENDING_VERIFICATION: "pending_verification",
    VERIFIED: "verified",
    SUSPENDED: "suspended",
    INACTIVE: "inactive"
  },
  
  // Customer Statuses
  CUSTOMER_STATUSES: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended"
  }
};
