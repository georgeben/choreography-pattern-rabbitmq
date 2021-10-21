const { connectToRabbitMQ } = require("./rabbitmq");

module.exports = async function publishToQueue(messages) {
  const { conn, channel } = await connectToRabbitMQ();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const { exchange, routingKey, message: data, headers } = message;
    await channel.publish(exchange, routingKey, data, {
      deliveryMode: 2,
      mandatory: true,
      ...headers,
    });
    console.log("Published to queue");
    setTimeout(async() => {
      await conn.close();
    }, 60);
  }
}