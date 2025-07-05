// Using axios library for requests
const axios = require("axios");

// Quote fetcher using zenQuotes API
async function fetchQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random");
    return `${response.data[0].q} - ${response.data[0].a}`;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw new Error("Could not fetch quote at this time.");
  }
}

module.exports = { fetchQuote };
