const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateMe,
    deleteMe
} = require("../../controllers/auth/authController");
const { protect } = require("../../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);


// Export the router
module.exports = router;
