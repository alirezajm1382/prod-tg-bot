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
const MESSAGES = require("../lib/messages");
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
bot.onText(/\/start/, (msg) => {
  let chatId = msg.chat.id;
  registerUser(msg.from.id, msg.from.username)
    .then(() => {
      console.log(`[log] User ${msg.from.username} registered successfully.`);
      bot.sendMessage(chatId, MESSAGES.WELCOME, {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: HomeInlineKeyboard,
          resize_keyboard: true,
        },
      });
    })
    .catch((error) => {
      console.error(
        `[error] Error registering user ${msg.from.username}:`,
        error
      );
      bot.sendMessage(chatId, MESSAGES.REGISTER_ERROR);
    });
});

// ================= Callbacks ================= //
bot.onText("📚 Get Quote", async (msg) => {
  bot.emit("callback_query", {
    data: "quote",
    query: {
      from: msg.from,
      message: { chat: msg.chat },
    },
  });
});
bot.onText("🎯 My Tasks", async (msg) => {
  let chatId = msg.chat.id;
  getTasks(msg.from.id)
    .then((tasks) => {
      if (tasks.length === 0) {
        bot.sendMessage(chatId, MESSAGES.NO_TASKS, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "🏠 Home", callback_data: "home" }]],
          },
        });
      } else {
        bot.sendMessage(chatId, MESSAGES.TASKS_HEADER(tasks.length), {
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
        `[error] Error fetching tasks for user ${msg.from.username}:`,
        error
      );
      bot.sendMessage(chatId, MESSAGES.FETCH_TASKS_ERROR);
    });
  return;
});
bot.onText("📝 Add Task", async (msg) => {
  bot.sendMessage(msg.chat.id, MESSAGES.TASK_ADD_PROMPT, {
    message_thread_id: msg.message_thread_id,
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "Type your task here...",
    },
  });
  bot.once("message", (reply) => {
    if (reply.text) {
      addTask(msg.from.id, reply.text)
        .then((task) => {
          bot.sendMessage(msg.chat.id, MESSAGES.TASK_ADD_SUCCESS);
          bot.emit("callback_query", {
            data: `my_tasks`,
            from: msg.from,
            message: { chat: msg.chat },
          });
        })
        .catch((error) => {
          console.error(`[error] Error adding task:`, error);
          bot.sendMessage(msg.chat.id, MESSAGES.TASK_ADD_ERROR);
        });
    } else if (!reply.text && reply.text.trim() === "") {
      bot.sendMessage(msg.chat.id, MESSAGES.NO_TASK_PROVIDED);
    }
  });
});
bot.onText("⏲️ Pomodoro Timer", async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, MESSAGES.POMODORO_START, {
    reply_markup: {
      inline_keyboard: [{ text: "😴 Stop Timer", callback_data: "killtimers" }],
    },
  });
  timeout = setTimeout(() => {
    bot.sendMessage(chatId, MESSAGES.POMODORO_END);
  }, 25 * 60 * 1000);
});
bot.onText("☠️ Kill Timers", async (msg) => {
  clearTimeout(timeout);
  bot.sendMessage(msg.chat.id, MESSAGES.KILL_TIMERS, {
    reply_markup: {
      keyboard: HomeInlineKeyboard,
    },
  });
});

bot.on("callback_query", async (query) => {
  // Home
  if (query.data === "home") {
    bot.sendMessage(query.message.chat.id, MESSAGES.HOME_MENU, {
      reply_markup: {
        keyboard: HomeInlineKeyboard,
        resize_keyboard: true,
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
            { text: "🏠 Home", callback_data: "home" },
            {
              text: "Get another quote",
              callback_data: "quote",
            },
          ],
        ],
      },
    });
  }
  // My tasks
  else if (query.data === "my_tasks") {
    let chatId = query.message.chat.id;
    getTasks(query.from.id)
      .then((tasks) => {
        if (tasks.length === 0) {
          bot.sendMessage(chatId, MESSAGES.NO_TASKS, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Home", callback_data: "home" }],
                [{ text: "📝 Add Task", callback_data: "addtask" }],
              ],
            },
          });
        } else {
          bot.sendMessage(chatId, MESSAGES.TASKS_HEADER(tasks.length), {
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
          `[error] Error fetching tasks for user ${query.from.username}:`,
          error
        );
        bot.sendMessage(chatId, MESSAGES.FETCH_TASKS_ERROR);
      });
    return;
  }
  // View task item
  else if (query.data.toString().match(/my_tasks\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    getTaskById(id, query.from.id)
      .then((task) => {
        if (!task) {
          bot.sendMessage(query.message.chat.id, MESSAGES.TASK_NOT_FOUND);
        } else {
          let date = new Date(task.created_at);
          bot.sendMessage(
            query.message.chat.id,
            MESSAGES.TASK_DETAILS(
              task,
              date.toLocaleDateString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            ),
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: task.is_completed
                        ? "☑️ Mark as Undone"
                        : "✅ Mark as Done",
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
        console.error(`[error] Error fetching task by id:`, error);
        bot.sendMessage(query.message.chat.id, MESSAGES.FETCH_TASK_ERROR);
      });
  }
  // Delete task item
  else if (query.data.toString().match(/^delete_task\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    bot.sendMessage(query.message.chat.id, MESSAGES.DELETE_CONFIRM, {
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
    });
  }
  // Toggle item status
  else if (query.data.toString().match(/^toggle_status\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    toggleTaskCompleted(id, query.from.id)
      .then((task) => {
        bot.sendMessage(query.message.chat.id, MESSAGES.TASK_STATUS_UPDATED);
        bot.emit("callback_query", {
          data: `my_tasks ${task.id}`,
          from: query.from,
          message: { chat: query.message.chat },
        });
      })
      .catch((error) => {
        console.error(`[error] Error toggling task status:`, error);
        bot.sendMessage(query.message.chat.id, MESSAGES.TASK_STATUS_ERROR);
      });
  }
  // Confirm delete task
  else if (query.data.toString().match(/^confirm_delete\s[A-Za-z0-9]+/)) {
    let id = query.data.toString().split(" ")[1];
    deleteTask(id, query.from.id)
      .then(() => {
        bot.sendMessage(query.message.chat.id, MESSAGES.TASK_DELETED);
        bot.emit("callback_query", {
          data: "my_tasks",
          from: query.from,
          message: { chat: query.message.chat },
        });
      })
      .catch((error) => {
        console.error(`[error] Error deleting task:`, error);
        bot.sendMessage(query.message.chat.id, MESSAGES.TASK_DELETE_ERROR);
      });
  }
});
