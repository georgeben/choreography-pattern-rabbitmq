// Imaginary worker for sending emails

const { EXCHANGES, queues } = require("../queueTopology");
const { connectToRabbitMQ } = require("../rabbitmq");
const EVENTS = require("../events");

async function run() {
  const { conn, channel } = await connectToRabbitMQ();
  // Create exchanges
  const createExchanges = EXCHANGES.map((exchange) =>
    channel.assertExchange(exchange.name, exchange.type, {
      ...exchange.config,
    }),
  );
  await Promise.all(createExchanges);
  const q = await channel.assertQueue(queues.SEND_EMAIL.name, { durable: true });
  const bindings = queues.SEND_EMAIL.bindings.map((binding) => binding.routingKeys.map((key) => channel.bindQueue(q.queue, binding.exchange, key)))
  await Promise.all(bindings);

  console.log("Email worker running")
  
  await channel.prefetch(1);
  await channel.consume(
    q.queue,
    async (msg) => {
      try {
        console.info(`Received message`);

        const message = JSON.parse(msg.content.toString());
        switch (message.event) {
          case EVENTS.BUSINESS_USER_REGISTERED.name:
            console.log("Sent welcome email");
            console.log("Sent email confirmation");
            console.log("Sent getting started guides");
            break;
          case EVENTS.ADMIN_USER_REGISTERED.name:
            console.log("Sent welcome email");
            console.log("Sent email confirmation");
            break;
          case EVENTS.USER_PASSWORD_RESET_REQUESTED.name:
            console.log("Sending password reset email");
            break;
        }
        console.info(`Processed message`);
        channel.ack(msg);
      } catch (error) {
        const message = JSON.parse(msg.content.toString());
        console.error(`An error occurred`, { SendEmailError: error.toString() });
      }
    },
    { noAck: false }, // ensure that message acknowledged after processed - it must be false to work like so
  );
}

run();
