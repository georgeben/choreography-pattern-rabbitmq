const prefix = "demo";

const API_EXCHANGE = {
  name: `${prefix}.user.exchange`,
  type: "topic",
  config: {
    autoDelete: false,
    durable: true,
  },
};

const queues = {
  SEND_EMAIL: {
    name: `${prefix}.send-email.queue`,
    bindings: [
      {
        exchange: API_EXCHANGE.name,
        routingKeys: [
          "user.*.registered",
          "user.password.#"
        ]
      }
    ],
    config: {
      durable: true,
    }
  },
  SLACK_NOTIFICATION_SERVICE: {
    name: `${prefix}.slack-notification.queue`,
    bindings: [
      {
        exchange: API_EXCHANGE.name,
        routingKeys: [
          "user.business.registered"
        ]
      }
    ]
  },
  ELASTIC_SEARCH_INDEXER: {
    name: `${prefix}.es.queue`,
    bindings: [
      {
        exchange: API_EXCHANGE.name,
        routingKeys: [
          "user.*.registered",
        ]
      }
    ]
  },
}

exports.EXCHANGES = [
  API_EXCHANGE,
]

exports.API_EXCHANGE = API_EXCHANGE;

exports.queues = queues;