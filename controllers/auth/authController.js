const supabase = require("../../config/supabaseClient");
const asyncHandler = require("express-async-handler");

// @desc Register new user
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: "Email, password and full_name are required" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role: role || "customer", // default role
      },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    message: "User registered successfully",
    user: data.user,
    session: data.session,
  });
});

// @desc Login user
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    message: "Login successful",
    user: data.user,
    session: data.session,
  });
});

// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: req.user });
});

// @desc Update current logged-in user
// @route PATCH /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { email, full_name, password, role } = req.body;

  // Build admin update payload to avoid relying on session-bound updateUser
  const updatePayload = { user_metadata: { ...(req.user?.user_metadata || {}) } };

  if (email) updatePayload.email = email;
  if (full_name) updatePayload.user_metadata.full_name = full_name;

  // Only allow role/password update if user is admin
  if (role || password) {
    if (req.user?.user_metadata?.role === "admin" || req.user?.user_metadata?.role === "superadmin") {
      if (role) updatePayload.user_metadata.role = role;
      if (password) updatePayload.password = password;
    } else {
      return res.status(403).json({ error: "Only admins can update role or password" });
    }
  }

  const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, updatePayload);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    success: true,
    message: "User updated successfully",
    user: data.user,
  });
});

// @desc Delete current logged-in user (hard delete using Admin API)
// @route DELETE /api/auth/me
const deleteMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { error } = await supabase.auth.admin.deleteUser(req.user.id);

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.json({
    success: true,
    message: "Account deleted successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  deleteMe,
};
