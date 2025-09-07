const express = require("express");
const router = express.Router();

const adminController = require("../../../controllers/users/admins/adminController");
const { protect } = require("../../../middleware/authMiddleware");
const { authorizeRoles } = require("../../../middleware/roleMiddleware");

// ✅ Admin-only routes
router.get(
  "/users",
  protect,
  authorizeRoles("admin", "superadmin"),
  adminController.getAllUsers
);

router.patch(
  "/users/:id/role",
  protect,
  authorizeRoles("admin", "superadmin"),
  adminController.updateUserRole
);

router.patch(
  "/shippers/:id/status",
  protect,
  authorizeRoles("admin", "superadmin"),
  adminController.updateShipperStatus
);

module.exports = router;
