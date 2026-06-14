package queue

import amqp "github.com/rabbitmq/amqp091-go"
type RabbitMQ struct {
    conn    *amqp.Connection
    channel *amqp.Channel
}
func New(url string) (*RabbitMQ, error) {
    conn, err := amqp.Dial(url)
    if err != nil {
        return nil, err
    }

    ch, err := conn.Channel()
    if err != nil {
        return nil, err
    }

    return &RabbitMQ{conn: conn, channel: ch}, nil
}
func (r *RabbitMQ) Publish(queueName string, body []byte) error {
    _, err := r.channel.QueueDeclare(queueName, true, false, false, false, nil)
    if err != nil {
        return err
    }

    return r.channel.Publish("", queueName, false, false, amqp.Publishing{
        ContentType: "application/json",
        Body:        body,
    })
}
func (r *RabbitMQ) Close() {
    r.channel.Close()
    r.conn.Close()
}
func (r *RabbitMQ) Consume(queueName string) (<-chan amqp.Delivery, error) {
    _, err := r.channel.QueueDeclare(queueName, true, false, false, false, nil)
    if err != nil {
        return nil, err
    }

    return r.channel.Consume(queueName, "", true, false, false, false, nil)
}