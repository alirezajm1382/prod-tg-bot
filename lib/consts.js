// Home options for the inline keyboard
const HomeInlineKeyboard = [
  [
    { text: "📝 Add Task", callback_data: "addtask" },
    { text: "🎯 My Tasks", callback_data: "my_tasks" },
  ],
  [
    { text: "⏲️ Pomodoro Timer", callback_data: "pomodoro" },
    { text: "☠️ Kill Timers", callback_data: "killtimers" },
  ],
];

module.exports = {
  HomeInlineKeyboard,
};
