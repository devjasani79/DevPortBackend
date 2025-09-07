const express = require("express");
const router = express.Router();
const shipmentRequestController = require("../../controllers/shipments/shipmentRequestController");
const shipmentController = require("../../controllers/shipments/shipmentController");
const { protect } = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

// Shipment Requests (Customers create, Admins view all)
router.post("/requests", protect, authorizeRoles("customer"), shipmentRequestController.createShipmentRequest);
router.get("/requests", protect, authorizeRoles("admin", "superadmin"), shipmentRequestController.getAllShipmentRequests);
router.get("/requests/:id", protect, shipmentRequestController.getShipmentRequestById);

// Admin workflow for shipment requests
router.patch("/requests/:id/send-to-shippers", protect, authorizeRoles("admin", "superadmin"), shipmentRequestController.sendRequestToShippers);
router.patch(
    "/requests/:requestId/send-to-shipper/:shipperId",
    protect,
    authorizeRoles("admin", "superadmin"),
    shipmentRequestController.sendRequestToSingleShipper
);

router.patch("/requests/:id/select-quotation", protect, authorizeRoles("admin", "superadmin"), shipmentRequestController.selectQuotation);

// Customer workflow for quotation approval
router.patch("/requests/:id/approve-quotation", protect, authorizeRoles("customer"), shipmentRequestController.approveQuotation);
router.patch("/requests/:id/reject-quotation", protect, authorizeRoles("customer"), shipmentRequestController.rejectQuotation);

// Legacy status update (admin use)
router.patch("/requests/:id/status", protect, authorizeRoles("admin", "superadmin"), shipmentRequestController.updateShipmentRequestStatus);

// Actual Shipments (Created when quotation is accepted)
router.post("/", protect, authorizeRoles("admin", "superadmin"), shipmentController.createShipment);
router.get("/", protect, authorizeRoles("admin", "superadmin"), shipmentController.getAllShipments);
router.get("/:id", protect, shipmentController.getShipmentById);
router.patch("/:id/status", protect, authorizeRoles("admin", "superadmin"), shipmentController.updateShipmentStatus);

module.exports = router;
