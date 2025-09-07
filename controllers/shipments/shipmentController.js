const supabase = require("../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Create a new shipment (when quotation is accepted)
// @route POST /api/shipments
// @access Admin/Superadmin only
const createShipment = asyncHandler(async (req, res) => {
  const {
    quotation_id,
    shipper_id,
    customer_id,
    origin,
    destination,
    cargo_type,
    container_type,
    weight,
    volume,
    estimated_delivery_date,
    tracking_number,
    notes,
  } = req.body;

  // Verify the quotation exists and is customer approved
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quotation_id)
    .eq("status", "customer_approved")
    .single();

  if (quotationError || !quotation) {
    return res.status(400).json({ error: "Valid customer-approved quotation not found" });
  }

  const { data, error } = await supabase
    .from("shipments")
    .insert([
      {
        quotation_id,
        shipper_id,
        customer_id,
        origin,
        destination,
        cargo_type,
        container_type,
        weight,
        volume,
        estimated_delivery_date,
        tracking_number,
        notes,
        status: "in_transit",
      },
    ])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update quotation status to accepted
  await supabase
    .from("quotations")
    .update({ 
      status: "accepted",
      updated_at: new Date()
    })
    .eq("id", quotation_id);

  // Update shipment request status to quotation_accepted
  await supabase
    .from("shipment_requests")
    .update({ 
      status: "quotation_accepted",
      updated_at: new Date()
    })
    .eq("id", quotation.shipment_request_id);

  res.status(201).json(data);
});

// @desc Get all shipments
// @route GET /api/shipments
// @access Admin/Superadmin only
const getAllShipments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("shipments")
    .select(`
      *,
      quotations(*),
      shippers(*),
      customers(*)
    `);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Get shipment by ID
// @route GET /api/shipments/:id
// @access Owner (customer/shipper) or Admin/Superadmin
const getShipmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("shipments")
    .select(`
      *,
      quotations(*),
      shippers(*),
      customers(*)
    `)
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: error.message });

  // Check if user has access to this shipment
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin) {
    // Check if the user owns either the customer or shipper profile
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("user_id")
      .eq("id", data.customer_id)
      .single();
    
    const { data: shipper, error: shipperError } = await supabase
      .from("shippers")
      .select("user_id")
      .eq("id", data.shipper_id)
      .single();
    
    if ((customerError || customer.user_id !== req.user.id) && 
        (shipperError || shipper.user_id !== req.user.id)) {
      return res.status(403).json({ error: "Access denied" });
    }
  }

  res.json(data);
});

// @desc Update shipment status
// @route PATCH /api/shipments/:id/status
// @access Admin/Superadmin only
const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { data, error } = await supabase
    .from("shipments")
    .update({ status, updated_at: new Date() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: `Shipment status updated to ${status}`, shipment: data });
});

module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipmentStatus,
};
