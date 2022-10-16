// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const axios = require("axios");
const moment = require("moment");
const queryString = require("query-string");
const schedule = require("node-schedule");

async function getForecast() {
  let results = {
    willRain: false,
    rainyDays: [],
    rainPercent: [],
  };
  let now = moment.utc();
  let startTime = moment.utc(now).add(0, "minutes").toISOString();
  let endTime = moment.utc(now).add(5, "days").toISOString();

  await axios
    .get(
      `https://api.tomorrow.io/v4/timelines?location=34.254691,-77.846289&fields=precipitationProbability&fields=precipitationType&timesteps=1h&units=imperial&apikey=YzYG8RRkV6EzJlZg1XF1fo05Rdb7nDyN&${queryString.stringify(
        { startTime, endTime }
      )}`
    )
    .then((res) => {
      res.data.data.timelines[0].intervals.forEach((obj) => {
        if (obj.values.precipitationProbability >= 20) {
          if (results.willRain == false) {
            results.willRain = true;
          }
          results.rainyDays.push(obj.startTime);
          results.rainPercent.push(obj.values.precipitationProbability);
        }
      });
    });
  return results;
}

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
  const job = schedule.scheduleJob("0 12 * * *", async function () {
    (async () => {
      let result = await getForecast();
      console.log(result);
      let weatherStr = "";
      for (let i = 0; i < result.rainyDays.length; i++) {
        weatherStr +=
          result.rainyDays[i].toString() +
          " | " +
          result.rainPercent[i].toString() +
          "%" +
          "\n";
      }
      if (result.willRain == true) {
        client.channels.cache
          .find((channel) => channel.name == "washy")
          .send(
            "Today is not a good day to get a car wash!" +
              "\n" +
              `> ${weatherStr}`
          );
      } else {
        client.channels.cache
          .find((channel) => channel.name == "washy")
          .send("Today is a good day to get a car wash!");
      }
    })();
  });
});

// Login to Discord with your client's token
client.login(token);
