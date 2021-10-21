const { connectToRabbitMQ } = require("./rabbitmq");
const { EXCHANGES, queues } = require("./queueTopology");

module.exports = async function setupQueues() {
  const { conn, channel } = await connectToRabbitMQ();

    // Create exchanges
    const createExchanges = EXCHANGES.map((exchange) =>
      channel.assertExchange(exchange.name, exchange.type, {
        ...exchange.config,
      }),
    );
    await Promise.all(createExchanges);

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
  return {
    channel
  }
}