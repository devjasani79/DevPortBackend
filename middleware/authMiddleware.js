const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const supabase = require("../config/supabaseClient");

// Protect middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, token missing" });
  }

  // Try Supabase validation
  const { data, error } = await supabase.auth.getUser(token);
  if (data?.user && !error) {
    req.user = data.user;
    return next();
  }

  // Fallback: custom JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Not authorized, invalid token" });
  }
});

module.exports = { protect };
