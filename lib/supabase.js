// Using quiet option - omitting logs for the library
require("dotenv").config({ quiet: true });

// Using supabase-js for serverless database features
const { createClient } = require("@supabase/supabase-js");

// Initializing connection to supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// ================= USER SECTION ================= //
async function registerUser(userId, username) {
  const { data, error } = await supabase
    .from("users")
    .insert([{ id: userId, telegram_username: username }])
    .select();
  if (error) {
    if (error.code === "23505") {
      const existingUser = await getUser(userId);
      return existingUser;
    } else {
      throw error;
    }
  }
  return data;
}

async function getUser(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// ================= TASK SECTION ================= //
async function addTask(userId, content) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ owner_id: userId, content, is_completed: false, content }]);
  if (error) throw error;
  return data;
}

async function getTasks(userId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("owner_id", userId);
  if (error) throw error;
  return data;
}

async function getTaskById(taskId, userId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function deleteTask(taskId, userId) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("owner_id", userId);
  if (error) throw error;
  return { success: true };
}

async function toggleTaskCompleted(taskId, userId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("is_completed")
    .eq("id", taskId)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;

  const newStatus = !data.is_completed;

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ is_completed: newStatus })
    .eq("id", taskId)
    .eq("owner_id", userId);
  if (updateError) throw updateError;

  return { id: taskId, is_completed: newStatus };
}

module.exports = {
  registerUser,
  addTask,
  getUser,
  getTasks,
  getTaskById,
  toggleTaskCompleted,
  deleteTask,
};
