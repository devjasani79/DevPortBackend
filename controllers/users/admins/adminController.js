const supabase = require("../../../config/supabaseClient");
const asyncHandler = require("express-async-handler");
// @desc Get all users (profiles)
// @route GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// @desc Update user role (cannot assign superadmin)
// @route PATCH /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role === "superadmin") {
    return res.status(403).json({ error: "Admins cannot assign superadmin role" });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date() })
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Role updated successfully" });
});

// @desc Suspend/Reactivate shipper
// @route PATCH /api/admin/shippers/:id/status
const updateShipperStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending_verification", "verified", "suspended", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const { data, error } = await supabase
    .from("shippers")
    .update({ status, updated_at: new Date() })
    .eq("id", id)
    .select("*"); // don't force single here

  if (error) return res.status(400).json({ error: error.message });

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Shipper not found" });
  }

  res.json({ message: `Shipper status updated to ${status}`, shipper: data[0] });
});



module.exports = {
  getAllUsers,
  updateUserRole,
  updateShipperStatus,
};
