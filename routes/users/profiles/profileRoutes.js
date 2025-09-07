const express = require("express");
const router = express.Router();
const {
  getProfiles,
  getProfileById,
  createOrUpdateProfile,
  updateProfileVerification,
} = require("../../../controllers/users/profiles/profileController");
const { protect } = require("../../../middleware/authMiddleware");
const { authorizeRoles } = require("../../../middleware/roleMiddleware");

// ✅ Only Admin & Superadmin can see all profiles
router.get("/", protect, authorizeRoles("admin", "superadmin"), getProfiles);

// ✅ Any logged-in user can see their own profile, 
// but Admin/Superadmin can see others as well
router.get("/:id", protect, getProfileById);

// ✅ Users can create/update their own profile
router.post("/", protect, createOrUpdateProfile);

// ✅ Admin/Superadmin can update profile verification status
router.patch("/:id/verify", protect, authorizeRoles("admin", "superadmin"), updateProfileVerification);

module.exports = router;
