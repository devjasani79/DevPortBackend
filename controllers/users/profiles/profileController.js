const supabase = require("../../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Get all user profiles
// @route GET /api/profiles
// @access Admin/Superadmin only
const getProfiles = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // For admin/superadmin, also fetch related customer and shipper data
  const profilesWithDetails = await Promise.all(
    data.map(async (profile) => {
      const [customerData, shipperData] = await Promise.all([
        supabase.from("customers").select("*").eq("user_id", profile.id).single(),
        supabase.from("shippers").select("*").eq("user_id", profile.id).single()
      ]);

      return {
        ...profile,
        customer: customerData.data || null,
        shipper: shipperData.data || null
      };
    })
  );

  res.json(profilesWithDetails);
});

// @desc Get single profile by ID
// @route GET /api/profiles/:id
// @access Owner or Admin/Superadmin
const getProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({ error: error.message });
  }

  // Check if user has access to this profile
  const userRole = req.user.user_metadata?.role;
  const isAdmin = ["admin", "superadmin"].includes(userRole);

  if (!isAdmin && data.id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Fetch related customer and shipper data
  const [customerData, shipperData] = await Promise.all([
    supabase.from("customers").select("*").eq("user_id", data.id).single(),
    supabase.from("shippers").select("*").eq("user_id", data.id).single()
  ]);

  const profileWithDetails = {
    ...data,
    customer: customerData.data || null,
    shipper: shipperData.data || null
  };

  res.json(profileWithDetails);
});

// @desc Create or update profile
// @route POST /api/profiles
// @access Authenticated users (for their own profile)
const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, role } = req.body;

  // Check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", req.user.id)
    .single();

  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        role,
        updated_at: new Date()
      })
      .eq("id", req.user.id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        id: req.user.id,
        full_name,
        phone,
        role: role || "customer",
        is_verified: false,
      }])
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  }
});

// @desc Update profile verification status
// @route PATCH /api/profiles/:id/verify
// @access Admin/Superadmin only
const updateProfileVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      is_verified,
      updated_at: new Date()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({
    message: `Profile verification status updated to ${is_verified}`,
    profile: data
  });
});

module.exports = {
  getProfiles,
  getProfileById,
  createOrUpdateProfile,
  updateProfileVerification,
};
