const supabase = require("../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Create a new shipment request (Customer)
// @route POST /api/shipments/requests
// @access Customer only
const createShipmentRequest = asyncHandler(async (req, res) => {
  const {
    origin,
    destination,
    preferred_mode,
    cargo_type,
    container_type,
    weight,
    volume,
    notes,
  } = req.body;

  // 1. Find the customer linked to this user
  const { data: customer, error: customerError } = await supabase
    .from("customers")
   .select("id, user_id")

    .eq("user_id", req.user.id)
    .single();

  if (customerError || !customer) {
    return res.status(400).json({ error: "Customer profile not found for this user." });
  }


  // 2. Insert shipment request using customers.id
  const { data, error } = await supabase
    .from("shipment_requests")
    .insert([
      {
        customer_id: customer.id, // ✅ correct FK
        origin,
        destination,
        preferred_mode,
        cargo_type,
        container_type,
        weight,
        volume,
        notes,
        status: "pending",
      },
    ])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// @desc Get all shipment requests (Admin / Superadmin)
// @route GET /api/shipments/requests
// @access Admin/Superadmin only
const getAllShipmentRequests = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("shipment_requests")
    .select(`
      *,
      customers(*)
    `);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Get shipment request by ID
// @route GET /api/shipments/requests/:id
// @access Owner (customer) or Admin/Superadmin
const getShipmentRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("shipment_requests")
    .select(`
      *,
      customers(*)
    `)
    .eq("id", id)
    // .single();

  if (error) return res.status(404).json({ error: error.message });

  // Check if user has access to this shipment request
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin) {
    // Check if the user owns the customer profile that created this shipment request
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("user_id")
      .eq("id", data.customer_id)
      .single();
    
    if (customerError || customer.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
  }

  res.json(data);
});

// @desc Admin sends shipment request to shippers
// @route PATCH /api/shipments/requests/:id/send-to-shippers
// @access Admin/Superadmin only
const sendRequestToShippers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { admin_notes, filter_mode } = req.body;

  // 1. Verify shipment request exists and is still pending
  const { data: shipmentRequest, error: requestError } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (requestError || !shipmentRequest) {
    return res
      .status(400)
      .json({ error: "Shipment request not found or not in pending status" });
  }

  // 2. Find eligible shippers (only verified ones)
  let query = supabase.from("shippers").select("id, modes_supported").eq("status", "verified");

  if (filter_mode) {
    query = query.contains("modes_supported", [filter_mode]);
  }

  const { data: shippers, error: shippersError } = await query;
  if (shippersError) return res.status(400).json({ error: shippersError.message });

  if (!shippers.length) {
    return res.status(400).json({ error: "No eligible shippers found" });
  }

  // 3. Insert mapping into shipment_request_shipper
  const links = shippers.map((s) => ({
    shipment_request_id: id,
    shipper_id: s.id,
    status: "pending",
  }));

  const { error: linkError } = await supabase
    .from("shipment_request_shipper")
    .insert(links);

  if (linkError) return res.status(400).json({ error: linkError.message });

  // 4. Update shipment request status
  const { data, error } = await supabase
    .from("shipment_requests")
    .update({
      status: "sent_to_shippers",
      admin_notes,
      updated_at: new Date(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    message: `Shipment request sent to ${shippers.length} shippers`,
    shipmentRequest: data,
    shippersSent: shippers,
  });
});

// @desc Admin sends request to a specific shipper
// @route PATCH /api/shipments/requests/:id/send-to-shipper/:shipperId
// @access Admin/Superadmin
const sendRequestToSingleShipper = asyncHandler(async (req, res) => {
  const { id, shipperId } = req.params;
  const { admin_notes } = req.body;

  // Verify shipment request exists
  const { data: shipmentRequest, error: reqError } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (reqError || !shipmentRequest) {
    return res.status(404).json({ error: "Shipment request not found" });
  }

  // Verify shipper exists and is verified
  const { data: shipper, error: shipperError } = await supabase
    .from("shippers")
    .select("*")
    .eq("id", shipperId)
    .eq("status", "verified")
    .single();

  if (shipperError || !shipper) {
    return res.status(404).json({ error: "Shipper not found or not verified" });
  }

  // Insert into join table (if not already present)
  const { data, error } = await supabase
    .from("shipment_request_shipper")
    .upsert({
      shipment_request_id: id,
      shipper_id: shipperId,
      status: "acknowledged",
      admin_notes,
      created_at: new Date(),
    }, { onConflict: "shipment_request_id,shipper_id" });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Shipment request sent to shipper", data });
});


// @desc Admin selects a quotation for customer approval
// @route PATCH /api/shipments/requests/:id/select-quotation
// @access Admin/Superadmin only
const selectQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quotation_id, admin_selection_notes } = req.body;

  // Verify shipment request exists and has quotations
  const { data: shipmentRequest, error: requestError } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "quotations_received")
    .single();

  if (requestError || !shipmentRequest) {
    return res.status(400).json({ error: "Shipment request not found or no quotations received" });
  }

  // Verify quotation exists and belongs to this request
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quotation_id)
    .eq("shipment_request_id", id)
    .eq("status", "pending")
    .single();

  if (quotationError || !quotation) {
    return res.status(400).json({ error: "Quotation not found or not available" });
  }

  // Update quotation status to admin_selected
  const { error: quotationUpdateError } = await supabase
    .from("quotations")
    .update({ 
      status: "admin_selected",
      admin_selection_notes,
      updated_at: new Date()
    })
    .eq("id", quotation_id);

  if (quotationUpdateError) {
    return res.status(400).json({ error: quotationUpdateError.message });
  }

  // Update shipment request status and selected quotation
  const { data, error } = await supabase
    .from("shipment_requests")
    .update({ 
      status: "quotation_selected",
      selected_quotation_id: quotation_id,
      updated_at: new Date()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ 
    message: "Quotation selected successfully, waiting for customer approval", 
    shipmentRequest: data,
    selectedQuotation: quotation
  });
});

// @desc Customer approves admin's quotation selection
// @route PATCH /api/shipments/requests/:id/approve-quotation
// @access Customer only
const approveQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customer_approval_notes } = req.body;

  // Verify shipment request exists and is waiting for customer approval
  const { data: shipmentRequest, error: requestError } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "quotation_selected")
    .single();

  if (requestError || !shipmentRequest) {
    return res.status(400).json({ error: "Shipment request not found or not waiting for approval" });
  }

  // Check if customer owns this request
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("user_id")
    .eq("id", shipmentRequest.customer_id)
    .single();

  if (customerError || customer.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Update quotation status to customer_approved
  const { error: quotationUpdateError } = await supabase
    .from("quotations")
    .update({ 
      status: "customer_approved",
      customer_approval_notes,
      updated_at: new Date()
    })
    .eq("id", shipmentRequest.selected_quotation_id);

  if (quotationUpdateError) {
    return res.status(400).json({ error: quotationUpdateError.message });
  }

  // Update shipment request status
  const { data, error } = await supabase
    .from("shipment_requests")
    .update({ 
      status: "customer_approved",
      customer_approval_notes,
      updated_at: new Date()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ 
    message: "Quotation approved successfully", 
    shipmentRequest: data
  });
});

// @desc Customer rejects admin's quotation selection
// @route PATCH /api/shipments/requests/:id/reject-quotation
// @access Customer only
const rejectQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customer_approval_notes } = req.body;

  // Verify shipment request exists and is waiting for customer approval
  const { data: shipmentRequest, error: requestError } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "quotation_selected")
    .single();

  if (requestError || !shipmentRequest) {
    return res.status(400).json({ error: "Shipment request not found or not waiting for approval" });
  }

  // Check if customer owns this request
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("user_id")
    .eq("id", shipmentRequest.customer_id)
    .single();

  if (customerError || customer.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Update quotation status to rejected
  const { error: quotationUpdateError } = await supabase
    .from("quotations")
    .update({ 
      status: "rejected",
      customer_approval_notes,
      updated_at: new Date()
    })
    .eq("id", shipmentRequest.selected_quotation_id);

  if (quotationUpdateError) {
    return res.status(400).json({ error: quotationUpdateError.message });
  }

  // Reset shipment request status to pending for admin to select another quotation
  const { data, error } = await supabase
    .from("shipment_requests")
    .update({ 
      status: "quotations_received",
      selected_quotation_id: null,
      customer_approval_notes,
      updated_at: new Date()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ 
    message: "Quotation rejected, admin can select another quotation", 
    shipmentRequest: data
  });
});

// @desc Update shipment request status (legacy - for admin use)
// @route PATCH /api/shipments/requests/:id/status
// @access Admin/Superadmin only
const updateShipmentRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { data, error } = await supabase
    .from("shipment_requests")
    .update({ status, updated_at: new Date() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: `Shipment request status updated to ${status}`, shipmentRequest: data });
});

module.exports = {
  createShipmentRequest,
  getAllShipmentRequests,
  getShipmentRequestById,
  sendRequestToShippers,
  sendRequestToSingleShipper,
  selectQuotation,
  approveQuotation,
  rejectQuotation,
  updateShipmentRequestStatus,
};
