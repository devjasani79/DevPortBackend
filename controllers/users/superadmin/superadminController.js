const supabase = require("../../../config/supabaseClient");
const asyncHandler = require("express-async-handler");
// @desc Promote/demote users (can assign superadmin)
// @route PATCH /api/superadmin/users/:id/role
const setUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date() })
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `User role set to ${role}` });
});

// @desc Delete any user
// @route DELETE /api/superadmin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });

  await supabase.from("profiles").delete().eq("id", id);
  res.json({ message: "User deleted successfully by superadmin" });
});

module.exports = {
  setUserRole,
  deleteUser,
};
