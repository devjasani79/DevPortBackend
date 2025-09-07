const express = require("express");
const router = express.Router();
const shippersController = require("../../../controllers/users/shippers/shippersController");
const { protect } = require("../../../middleware/authMiddleware");
const { authorizeRoles } = require("../../../middleware/roleMiddleware");

// ✅ Shipper registration (user → shipper)
router.post(
  "/",
  protect,
  authorizeRoles("shipper"),
  shippersController.registerShipper
);

// ✅ Admins & Superadmins can view all shippers
router.get(
  "/",
  protect,
  authorizeRoles("admin", "superadmin"),
  shippersController.getAllShippers
);

// ✅ Anyone logged in can view a specific shipper
router.get(
  "/:id",
  protect,
  authorizeRoles("customer", "shipper", "admin", "superadmin"),
  shippersController.getShipperById
);

// ✅ Update shipper profile (owner or admin)
router.put(
  "/:id",
  protect,
  shippersController.updateShipper
);

// Only admins can delete customer profiles
router.delete("/:id", shippersController.deleteShipper);

module.exports = router;
