const axios = require("axios");

async function fetchQuote() {
  try {
    const { data } = await axios.get("https://zenquotes.io/api/random");
    const [quote] = data;
    return `${quote.q} - ${quote.a}`;
  } catch (error) {
    console.error("Error fetching quote:", error.message);
    throw new Error("Could not fetch quote at this time.");
  }
}

module.exports = { fetchQuote };
