const supabase = require("../../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Get all customers
// @route GET /api/customers
// @access Admin/Superadmin only
const getAllCustomers = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Get customer by ID
// @route GET /api/customers/:id
// @access Owner (customer) or Admin/Superadmin
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return res.status(404).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Customer not found" });

  // Check if user has access to this customer profile
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin && data.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Fetch related shipment requests explicitly
  const [{ data: shipmentRequests, error: srError }, { data: quotations, error: qError }] = await Promise.all([
    supabase.from("shipment_requests").select("*").eq("customer_id", id),
    // Fetch quotations for all shipment requests that belong to this customer
    (async () => {
      const { data: srIds, error: srIdsError } = await supabase
        .from("shipment_requests")
        .select("id")
        .eq("customer_id", id);
      if (srIdsError) return { data: null, error: srIdsError };
      const ids = (srIds || []).map((r) => r.id);
      if (ids.length === 0) return { data: [], error: null };
      const { data: qData, error: qErr } = await supabase
        .from("quotations")
        .select("*")
        .in("shipment_request_id", ids);
      return { data: qData, error: qErr };
    })(),
  ]);

  if (srError) return res.status(400).json({ error: srError.message });
  if (qError) return res.status(400).json({ error: qError.message });

  res.json({ ...data, shipment_requests: shipmentRequests || [], quotations: quotations || [] });
});

// @desc Create a new customer profile
// @route POST /api/customers
// @access Authenticated users (for their own profile)
const createCustomer = asyncHandler(async (req, res) => {
  const {
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  // Check if customer profile already exists for this user
  const { data: existingCustomer, error: checkError } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", req.user.id)
    .single();

  if (existingCustomer) {
    return res.status(400).json({ error: "Customer profile already exists for this user" });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert([{
      user_id: req.user.id,
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      status: "active",
    }])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// @desc Update customer profile
// @route PUT /api/customers/:id
// @access Owner (customer) or Admin/Superadmin
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user has access to update this customer profile
  const { data: existingCustomer, error: checkError } = await supabase
    .from("customers")
    .select("user_id")
    .eq("id", id)
    .single();

  if (checkError) return res.status(404).json({ error: "Customer not found" });

  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);
  
  if (!isAdmin && existingCustomer.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  const { data, error } = await supabase
    .from("customers")
    .update({ ...req.body, updated_at: new Date() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Delete customer profile
// @route DELETE /api/customers/:id
// @access Admin/Superadmin only
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Customer deleted successfully" });
});

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
