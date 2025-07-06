// ================= Messages ================= //
const MESSAGES = {
  WELCOME: `Welcome to your Productivity Bot!🤖\nThis is the place where you can pass your exams, <b><u>FINALLY!</u></b>🎊 Here are some things you can do: 👇🏽`,
  REGISTER_ERROR: "There was an error registering you. Please try again later.",
  NO_TASKS:
    "<b>You have no tasks!</b> 🎊\n\nEnjoy the free time or add some new to-do items to stay on track. Just tap to add a new task whenever you're ready!",
  TASKS_HEADER: (count) => `<b>Your tasks: (${count})</b>`,
  TASK_ADD_PROMPT: "Please send me the task you want to add.",
  TASK_ADD_SUCCESS: "Task Added Successfully! 🎊",
  TASK_ADD_ERROR:
    "There was an error adding your task. Please try again later.",
  NO_TASK_PROVIDED: "No task provided.",
  POMODORO_START:
    "Pomodoro Timer started! Work for 25 minutes, then take a 5-minute break.",
  POMODORO_END: "25 minutes are up! Take a 5-minute break.",
  KILL_TIMERS: "All timers have been stopped. ✅",
  FETCH_TASKS_ERROR:
    "There was an error fetching your tasks. Please try again later.",
  HOME_MENU: "Welcome back to the home menu!",
  TASK_NOT_FOUND: "Task not found.",
  TASK_DETAILS: (task, date) =>
    `<b>Task details:</b>\n\n<b>Title</b>: ${task.content}\n<b>Status</b>: ${
      task.is_completed ? "Done ✅" : "Undone ☑️"
    }\n\n<b>Created at:</b>\n${date}`,
  FETCH_TASK_ERROR:
    "There was an error fetching the task. Please try again later.",
  DELETE_CONFIRM:
    "Are you sure you want to delete this task? This action cannot be undone.",
  TASK_STATUS_UPDATED: "Task status updated.",
  TASK_STATUS_ERROR:
    "There was an error updating the task status. Please try again later.",
  TASK_DELETED: "Task deleted successfully.",
  TASK_DELETE_ERROR:
    "There was an error deleting the task. Please try again later.",
};

module.exports = MESSAGES;