const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables. Check .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by making a dummy query
(async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connected successfully");
    }
  } catch (err) {
    console.error("❌ Supabase test connection error:", err.message);
  }
})();

module.exports = supabase;
