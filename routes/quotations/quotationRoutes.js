const express = require("express");
const router = express.Router();
const quotationController = require("../../controllers/quotations/quotationController");
const { protect } = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

// Shippers create quotations
router.post("/", protect, authorizeRoles("shipper"), quotationController.createQuotation);

// Admin/Superadmin view all
router.get("/", protect, authorizeRoles("admin", "superadmin"), quotationController.getAllQuotations);

// Get quotations for a specific shipment request
router.get("/request/:requestId", protect, quotationController.getQuotationsByRequest);

// Owner (shipper) or Admin/Superadmin view one
router.get("/:id", protect, quotationController.getQuotationById);

// Admin can update status (legacy)
router.patch("/:id/status", protect, authorizeRoles("admin", "superadmin"), quotationController.updateQuotationStatus);

module.exports = router;
