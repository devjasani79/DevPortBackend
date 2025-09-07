const express = require("express");
const router = express.Router();
const superAdminController = require("../../../controllers/users/superadmin/superadminController");
const { protect } = require("../../../middleware/authMiddleware");
const { authorizeRoles } = require("../../../middleware/roleMiddleware");

// ✅ Superadmin-only routes
router.patch(
    "/users/:id/role",
    protect,
    authorizeRoles("superadmin"),
    superAdminController.setUserRole
);

router.delete(
    "/users/:id",
    protect,
    authorizeRoles("superadmin"),
    superAdminController.deleteUser
);

module.exports = router;
