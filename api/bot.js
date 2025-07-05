// Using quiet option - omitting logs for the library
require("dotenv").config({ quiet: true });

// ================= API actions ================= //

// Database related
const {
  registerUser,
  addTask,
  getTasks,
  getTaskById,
  deleteTask,
  toggleTaskCompleted,
} = require("../lib/supabase");

// Quote fetcher
const { fetchQuote } = require("../lib/quotes");

// Consts and repeatables
const { HomeInlineKeyboard } = require("../lib/consts");

// Importing and initializing Telegram bot using token from .env file
const TelegramBot = require("node-telegram-bot-api");
let bot;
try {
  bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true,
  });
} catch (error) {
  throw new Error("[tg.bot] something went wrong while connecting to the bot");
}

/// A variable for setting and clearing timeouts (used in pomodoro timers feature)
let timeout;

// Handing start command, when a user sends /start
// this event is also triggered when the user begins chatting with the bot for the first time
bot.onText(/\/start/, (msg) => {
  let chatId = msg.chat.id;
  registerUser(msg.from.id, msg.from.username)
    .then(() => {
      console.log(`User ${msg.from.username} registered successfully.`);
      bot.sendMessage(
        chatId,
        `Welcome to your Productivity Bot!🤖\nThis is the place where you can pass your exams, <b><u>FINALLY!</u></b>🎊 Here are some things you can do: 👇🏽`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: HomeInlineKeyboard,
          },
        }
      );
    })
    .catch((error) => {
      console.error(`Error registering user ${msg.from.username}:`, error);
      bot.sendMessage(
        chatId,
        "There was an error registering you. Please try again later."
      );
    });
});

// ================= Callbacks ================= //
bot.on("callback_query", async (query) => {
  // Home
  if (query.data === "home") {
    bot.sendMessage(query.message.chat.id, "Welcome back to the home menu!", {
      reply_markup: {
        inline_keyboard: HomeInlineKeyboard,
      },
    });
  }
  // Quote
  else if (query.data === "quote") {
    let quote = await fetchQuote();
    bot.sendMessage(query.message.chat.id, quote, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏠", callback_data: "home" },
            {
              text: "Get another quote",
              callback_data: "quote",
            },
          ],
        ],
      },
    });
  }
  // Add task
  else if (query.data === "addtask") {
    bot.sendMessage(
      query.message.chat.id,
      "Please send me the task you want to add.",
      {
        message_thread_id: query.message.message_thread_id,
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Type your task here...",
        },
      }
    );
    bot.once("message", (reply) => {
      if (reply.text) {
        addTask(query.from.id, reply.text)
          .then((task) => {
            bot.sendMessage(
              query.message.chat.id,
              "Task Added Successfully! 🎊"
            );
            bot.emit("callback_query", {
              data: `my_tasks`,
              from: query.from,
              message: { chat: query.message.chat },
            });
          })
          .catch((error) => {
            console.error(`Error adding task:`, error);
            bot.sendMessage(
              query.message.chat.id,
              "There was an error adding your task. Please try again later."
            );
          });
      } else if (!reply.text && reply.text.trim() === "") {
        bot.sendMessage(query.message.chat.id, "No task provided.");
      }
    });
  }
  // My tasks
  else if (query.data === "my_tasks") {
    let chatId = query.message.chat.id;
    getTasks(query.from.id)
      .then((tasks) => {
        if (tasks.length === 0) {
          bot.sendMessage(
            chatId,
            "<b>You have no tasks!</b> 🎊\n\nEnjoy the free time or add some new to-do items to stay on track. Just tap to add a new task whenever you're ready!",
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🏠 Home", callback_data: "home" }],
                  [{ text: "📝 Add Task", callback_data: "addtask" }],
                ],
              },
            }
          );
        } else {
          bot.sendMessage(chatId, `<b>Your tasks: (${tasks.length})</b>`, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: tasks.map((task) => {
                return [
                  {
                    text: `${task.is_completed ? "✅" : "☑️"} ${task.content}`,
                    callback_data: `my_tasks ${task.id}`,
                  },
                ];
              }),
            },
          });
        }
      })
      .catch((error) => {
        console.error(
          `Error fetching tasks for user ${query.from.username}:`,
          error
        );
        bot.sendMessage(
          chatId,
          "There was an error fetching your tasks. Please try again later."
        );
      });
    return;
  }
  // Pomodoro timer
  else if (query.data === "pomodoro") {
    const chatId = query.message.chat.id;
    bot.sendMessage(
      chatId,
      "Pomodoro Timer started! Work for 25 minutes, then take a 5-minute break.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "😴 Stop Timer", callback_data: "killtimers" }],
          ],
        },
      }
    );
    timeout = setTimeout(() => {
      bot.sendMessage(chatId, "25 minutes are up! Take a 5-minute break.");
    }, 25 * 60 * 1000);
  }
  // Kill timers
  else if (query.data === "killtimers") {
    clearTimeout(timeout);
    bot.sendMessage(query.message.chat.id, "All timers have been stopped. ✅", {
      reply_markup: {
        inline_keyboard: HomeInlineKeyboard,
      },
    });
  }
  // View task item
  else if (query.data.toString().match(/my_tasks\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    getTaskById(id, query.from.id)
      .then((task) => {
        if (!task) {
          bot.sendMessage(query.message.chat.id, "Task not found.");
        } else {
          let date = new Date(task.created_at);
          bot.sendMessage(
            query.message.chat.id,
            `<b>Task details:</b>\n\n<b>Title</b>: ${
              task.content
            }\n<b>Status</b>: ${
              task.is_completed ? "Done ✅" : "Undone ☑️"
            }\n\n<b>Created at:</b>\n${date.toLocaleDateString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: task.is_completed
                        ? "Mark as Undone ☑️"
                        : "Mark as Done ✅",
                      callback_data: `toggle_status ${task.id}`,
                    },
                    {
                      text: "🗑️ Delete Task",
                      callback_data: `delete_task ${task.id}`,
                    },
                  ],
                  [
                    { text: "🏠 Home", callback_data: "home" },
                    { text: "⬅️ Back to Tasks", callback_data: "my_tasks" },
                  ],
                ],
              },
            }
          );
        }
      })
      .catch((error) => {
        console.error(`Error fetching task by id:`, error);
        bot.sendMessage(
          query.message.chat.id,
          "There was an error fetching the task. Please try again later."
        );
      });
  }
  // Delete task item
  else if (query.data.toString().match(/^delete_task\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    bot.sendMessage(
      query.message.chat.id,
      "Are you sure you want to delete this task? This action cannot be undone.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "❌ Cancel",
                callback_data: `my_tasks ${id}`,
              },
              {
                text: "🗑️ Yes, delete",
                callback_data: `confirm_delete ${id}`,
              },
            ],
          ],
        },
      }
    );
  }
  // Toggle item status
  else if (query.data.toString().match(/^toggle_status\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    toggleTaskCompleted(id, query.from.id)
      .then((task) => {
        bot.sendMessage(query.message.chat.id, "Task status updated.");
        bot.emit("callback_query", {
          data: `my_tasks ${task.id}`,
          from: query.from,
          message: { chat: query.message.chat },
        });
      })
      .catch((error) => {
        console.error(`Error toggling task status:`, error);
        bot.sendMessage(
          query.message.chat.id,
          "There was an error updating the task status. Please try again later."
        );
      });
  }
  // Confirm delete task
  else if (query.data.toString().match(/^confirm_delete\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    deleteTask(id, query.from.id)
      .then(() => {
        bot.sendMessage(query.message.chat.id, "Task deleted successfully.");
        bot.emit("callback_query", {
          data: "my_tasks",
          from: query.from,
          message: { chat: query.message.chat },
        });
      })
      .catch((error) => {
        console.error(`Error deleting task:`, error);
        bot.sendMessage(
          query.message.chat.id,
          "There was an error deleting the task. Please try again later."
        );
      });
  }
});
