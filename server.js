const express = require("express");
const bodyParser = require("body-parser");
const { BUSINESS_USER_REGISTERED, ADMIN_USER_REGISTERED } = require("./events");
const publishEvent = require("./publish");
const { API_EXCHANGE } = require("./queueTopology");
require("./rabbitmq")

const app = express();
const PORT = 9091;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  return res.json({
    message: "Event Driven Architecture Choreography Pattern"
  })
});

app.post("/signup", async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({
      error: "Enter name",
    })
  }
  if (!req.body.email) {
    return res.status(400).json({
      error: "Enter email",
    })
  }
  if (!req.body.type) {
    return res.status(400).json({
      error: "Enter type",
    })
  }
  const payload = req.body;
  let event;
  if (payload.type == "business") {
    event = BUSINESS_USER_REGISTERED;
  } else {
    event = ADMIN_USER_REGISTERED
  }
  const message = Buffer.from(
    JSON.stringify({
      event: event.name,
      ...payload,
    }),
  );
  console.log("Event!", event.name);
  await publishEvent([
    {
      exchange: API_EXCHANGE.name,
      routingKey: event.name,
      message,
    }
  ])
  return res.json({
    message: "Sign up successful!",
  })
})

app.listen(PORT, (server) => console.log(`App listening on ${PORT}`))