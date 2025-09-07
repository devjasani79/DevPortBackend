const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../../../controllers/users/customers/customersController");
const { protect } = require("../../../middleware/authMiddleware");
const { authorizeRoles } = require("../../../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin/Superadmin can view all customers
router.get("/", authorizeRoles("admin", "superadmin"), getAllCustomers);

// Customers can view their own profile, admins can view any
router.get("/:id", getCustomerById);

// Authenticated users can create their own customer profile
router.post("/", createCustomer);

// Customers can update their own profile, admins can update any
router.put("/:id", updateCustomer);

// Only admins can delete customer profiles
router.delete("/:id", authorizeRoles("admin", "superadmin"), deleteCustomer);

module.exports = router;
