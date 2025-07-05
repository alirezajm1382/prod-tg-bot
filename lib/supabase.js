require("dotenv").config({ quiet: true });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ================= USER SECTION ================= //
async function registerUser(userId, username) {
  try {
    const { data } = await supabase
      .from("users")
      .insert([{ id: userId, telegram_username: username }])
      .select();
    return data;
  } catch (error) {
    if (error.code === "23505") {
      return getUser(userId);
    }
    throw error;
  }
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
    .insert([{ owner_id: userId, content, is_completed: false }])
    .select();
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
