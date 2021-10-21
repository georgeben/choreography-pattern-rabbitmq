const { BUSINESS_USER_REGISTERED, ADMIN_USER_REGISTERED } = require("../events");
const { API_EXCHANGE, EXCHANGES, queues } = require("../queueTopology");
const { connectToRabbitMQ } = require("../rabbitmq");

async function run() {
  const { conn, channel } = await connectToRabbitMQ();
  // Create exchanges
  const createExchanges = EXCHANGES.map((exchange) =>
    channel.assertExchange(exchange.name, exchange.type, {
      ...exchange.config,
    }),
  );
  await Promise.all(createExchanges);
  const q = await channel.assertQueue(queues.ELASTIC_SEARCH_INDEXER.name, { durable: true });
  const bindings = queues.ELASTIC_SEARCH_INDEXER.bindings
    .map((binding) => binding.routingKeys
      .map((key) => channel.bindQueue(q.queue, binding.exchange, key)))
  await Promise.all(bindings);

  console.log("Elastic search worker running")
  
  await channel.prefetch(1);
  await channel.consume(
    q.queue,
    async (msg) => {
      try {
        console.info(`Received message`);

        const message = JSON.parse(msg.content.toString());
        switch (message.event) {
          case BUSINESS_USER_REGISTERED.name:
            console.log("Indexed business");
            break;
        }

        console.info(`Processed message`);
        channel.ack(msg);
      } catch (error) {
        const message = JSON.parse(msg.content.toString());
        console.error(`An error occurred`, { ESWorkerError: error.toString() });
      }
    },
    { noAck: false }, // ensure that message acknowledged after processed - it must be false to work like so
  );
}

run();
