// Imaginary slack notification service

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
  const q = await channel.assertQueue(queues.SLACK_NOTIFICATION_SERVICE.name, { durable: true });
  const bindings = queues.SLACK_NOTIFICATION_SERVICE.bindings.map((binding) => binding.routingKeys.map((key) => channel.bindQueue(q.queue, binding.exchange, key)))
  await Promise.all(bindings);

  console.log("Slack worker running")
  
  await channel.prefetch(1);
  await channel.consume(
    q.queue,
    async (msg) => {
      try {
        console.info(`Received message`);
        const message = JSON.parse(msg.content.toString());

        switch (message.event) {
          case EVENTS.BUSINESS_USER_REGISTERED.name:
            console.log("Sent notification to slack");
            break;
        }
        console.info(`Processed message`);
        channel.ack(msg);
      } catch (error) {
        const message = JSON.parse(msg.content.toString());
        console.error(`An error occurred`, { SlackWorkerError: error.toString() });
      }
    },
    { noAck: false }, // ensure that message acknowledged after processed - it must be false to work like so
  );
}

run();
