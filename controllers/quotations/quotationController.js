const supabase = require("../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Shipper responds with a quotation
// @route POST /api/quotations
// @access Shipper only
const createQuotation = asyncHandler(async (req, res) => {
  const {
    shipment_request_id,
    price,
    currency,
    estimated_delivery_days,
    valid_until,
    additional_terms,
  } = req.body;

  // First get shipper profile by user_id
  const { data: shipper, error: shipperError } = await supabase
    .from("shippers")
    .select("id")
    .eq("user_id", req.user.id)
    .single();

  if (shipperError || !shipper) {
    return res.status(400).json({ error: "Shipper profile not found. Please complete your shipper profile first." });
  }

  const shipperId = shipper.id;

  // Verify shipment request exists and is sent to shippers
  const { data: shipmentRequest, error: requestError } = await supabase
    .from("shipment_requests")
    .select("id, status")
    .eq("id", shipment_request_id)
    .eq("status", "sent_to_shippers")
    .single();

  if (requestError || !shipmentRequest) {
    return res.status(400).json({ error: "Shipment request not found or not available for quotations" });
  }

  // Then insert quotation
  const { data, error } = await supabase
    .from("quotations")
    .insert([
      {
        shipment_request_id,
        shipper_id: shipperId,
        price,
        currency,
        estimated_delivery_days,
        valid_until,
        additional_terms,
        status: "pending",
      },
    ])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update shipment request status to quotations_received if this is the first quotation
  const { data: existingQuotations } = await supabase
    .from("quotations")
    .select("id")
    .eq("shipment_request_id", shipment_request_id)
    .neq("id", data.id);

  if (!existingQuotations || existingQuotations.length === 0) {
    // This is the first quotation, update shipment request status
    await supabase
      .from("shipment_requests")
      .update({ 
        status: "quotations_received",
        updated_at: new Date()
      })
      .eq("id", shipment_request_id);
  }

  res.status(201).json(data);
});

// @desc Get all quotations
// @route GET /api/quotations
// @access Admin/Superadmin
const getAllQuotations = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("quotations")
    .select(`
      *,
      shipment_requests(*),
      shippers(*)
    `);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Get quotation by ID
// @route GET /api/quotations/:id
// @access Shipper (owner) or Admin/Superadmin
const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("quotations")
    .select(`
      *,
      shipment_requests(*),
      shippers(*)
    `)
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: error.message });

  // Check if user has access to this quotation
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin && data.shipper_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(data);
});

// @desc Update quotation status (legacy - for admin use)
// @route PATCH /api/quotations/:id/status
// @access Admin/Superadmin only
const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "admin_selected", "customer_approved", "accepted", "rejected", "expired"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const { data, error } = await supabase
    .from("quotations")
    .update({ status, updated_at: new Date() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: `Quotation status updated to ${status}`, quotation: data });
});

// @desc Get quotations for a specific shipment request
// @route GET /api/quotations/request/:requestId
// @access Admin/Superadmin or Customer (owner of request)
const getQuotationsByRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  // Check if user has access to this request
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin) {
    // Check if the user owns the customer profile that created this request
    const { data: request, error: requestError } = await supabase
      .from("shipment_requests")
      .select("customer_id")
      .eq("id", requestId)
      .single();
    
    if (requestError || !request) {
      return res.status(404).json({ error: "Shipment request not found" });
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("user_id")
      .eq("id", request.customer_id)
      .single();
    
    if (customerError || customer.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
  }

  const { data, error } = await supabase
    .from("quotations")
    .select(`
      *,
      shippers(*),
      shipment_requests(*)
    `)
    .eq("shipment_request_id", requestId);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationsByRequest,
  updateQuotationStatus,
};
