const supabase = require("../../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Register as a shipper
// @route POST /api/shippers
// @access Customer users (to upgrade to shipper)
const registerShipper = asyncHandler(async (req, res) => {
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
    license_number,
    modes_supported,
  } = req.body;

  const userId = req.user.id;

  // Check if shipper profile already exists for this user
  const { data: existingShipper, error: checkError } = await supabase
    .from("shippers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingShipper) {
    return res.status(400).json({ error: "Shipper profile already exists for this user" });
  }

  const { data, error } = await supabase
    .from("shippers")
    .insert([
      {
        user_id: userId,
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
        license_number,
        modes_supported,
        status: "pending_verification"


      },
    ])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// @desc Get all shippers
// @route GET /api/shippers
// @access Admin/Superadmin only
const getAllShippers = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("shippers")
    .select(`
      *,
      quotations(*)
    `);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Get shipper by ID
// @route GET /api/shippers/:id
// @access Owner (shipper) or Admin/Superadmin
const getShipperById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("shippers")
    .select(`
      *,
      quotations(*)
    `)
    .eq("id", id)
    // .single();

  if (error) return res.status(404).json({ error: error.message });

  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin","shipper"].includes(userRole);

  if (!isAdmin && existingShipper.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }
  res.json(data);
});

// @desc Update shipper profile
// @route PUT /api/shippers/:id
// @access Owner (shipper) or Admin/Superadmin
const updateShipper = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user has access to update this shipper profile
  const { data: existingShipper, error: checkError } = await supabase
    .from("shippers")
    .select("user_id")
    .eq("id", id)
    .single();

  if (checkError) return res.status(404).json({ error: "Shipper not found" });

  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin","shipper"].includes(userRole);

  if (!isAdmin && existingShipper.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  const { data, error } = await supabase
    .from("shippers")
    .update({ ...req.body, updated_at: new Date() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Delete shipper profile
// @route DELETE /api/shippers/:id
// @access Admin/Superadmin only
const deleteShipper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase.from("shippers").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Shipper deleted successfully" });
});
module.exports = {
  registerShipper,
  getAllShippers,
  getShipperById,
  updateShipper,
  deleteShipper,
};
