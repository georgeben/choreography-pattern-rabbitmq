const amqp = require("amqplib")
const { EXCHANGES, queues } = require("./queueTopology");
// Connects to RabbitMQ
async function connectToRabbitMQ() {
  const conn = await amqp.connect(process.env.RABBITMQ_CONN_STRING);
  const channel = await conn.createConfirmChannel();
  return {
    conn,
    channel,
  };
}

(async function setupRabbitMQ() {
  const { conn, channel } = await connectToRabbitMQ();
  const createExchanges = EXCHANGES.map((exchange) =>
  channel.assertExchange(exchange.name, exchange.type, {
      ...exchange.config,
    }),
  );
  await Promise.all(createExchanges);
  console.log("Created rabbitmq exchanges")

  // Create queues
  const createQueues = Object.values(queues).map((queue) =>
    channel.assertQueue(queue.name, {
      ...queue.config,
    }),
  );
  await Promise.all(createQueues);

  // Create bindings
  const bindings = Object.values(queues).map((queue) =>
    queue.bindings.map((binding) =>
      binding.routingKeys.map((key) =>
        channel.bindQueue(queue.name, binding.exchange, key),
      ),
    ),
  );
  await Promise.all(bindings);
  console.log("Created queue bindings")
}())

exports.connectToRabbitMQ = connectToRabbitMQ;