const AWS = require("aws-sdk");
const serverless = require('serverless-http');
const express = require('express');
const app = express();
app.use(express.json());

const updateAwsKeys = async function (req) {
    const {
        awsRegion,
        awsAccessKey,
        awsSecretAccessKey
    } = req.body

    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    })
    return sqs = new AWS.SQS();
}

app.use('/list-sqs-queues', async (req, res) => {
    updateAwsKeys(req)

    try {
        console.log("Attempting to retrieve SQS queues")
        const data = await sqs.listQueues({}).promise()
        const results = [];
        if (data.QueueUrls !== undefined) {
            for (const sqsQueue of data.QueueUrls) {
                const n = sqsQueue.lastIndexOf('/');
                const QueueName = sqsQueue.substring(n + 1);
                const QueueUrl = data.QueueUrls
                const QueueDetails = {
                    "QueueName": `${QueueName}`,
                    "QueueUrl": `${QueueUrl}`
                };
                results.push(QueueDetails);
            }
            console.log("Found SQS queues")
            res.status(200).json(results);
        } else {
            res.status(200).json("No SQS queues found");
        }
    } catch (error) {
        console.log("Error attempting to retrieve SQS queues")
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/send-sqs-message', async (req, res) => {
    updateAwsKeys(req)
    const {
        sqsQueue,
        message
    } = req.body

    try {
        const params = {
            MessageBody: message,
            QueueUrl: sqsQueue,
            DelaySeconds: 0,
        };
        console.log(`Attempting to send message to SQS Queue ${sqsQueue}`)
        const data = await sqs.sendMessage(params).promise()
        console.log(`Successfully sent message to SQS Queue ${sqsQueue}`)
        res.status(200).json(data);
    } catch (error) {
        console.log(`Error attempting to send message to SQS Queue ${sqsQueue}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/purge-sqs-queue', async (req, res) => {
    updateAwsKeys(req)

    const QueueUrl = req.body.sqsQueue;
    try {
        const params = {
            QueueUrl: QueueUrl
        };
        console.log(`Attempting to purge queue ${QueueUrl}`)
        const data = await sqs.purgeQueue(params).promise()
        console.log(`Purged queue ${QueueUrl}`)
        res.status(200).json(data);
    } catch (error) {
        console.log(`Error attempting to purge queue ${QueueUrl}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/get-messages-from-sqs-queue', async (req, res) => {
    updateAwsKeys(req)
    const QueueUrl = req.body.sqsQueue;
    const params = {
        QueueUrl: QueueUrl,
        /* required */
        AttributeNames: [
            'All',
            // All | Policy | VisibilityTimeout | MaximumMessageSize | MessageRetentionPeriod | ApproximateNumberOfMessages | ApproximateNumberOfMessagesNotVisible | CreatedTimestamp | LastModifiedTimestamp | QueueArn | ApproximateNumberOfMessagesDelayed | DelaySeconds | ReceiveMessageWaitTimeSeconds | RedrivePolicy | FifoQueue | ContentBasedDeduplication | KmsMasterKeyId | KmsDataKeyReusePeriodSeconds,
            /* more items */
        ],
        MaxNumberOfMessages: 10,
        // MessageAttributeNames: [
        //     'STRING_VALUE',
        //     /* more items */
        // ],
        // ReceiveRequestAttemptId: 'STRING_VALUE',
        // VisibilityTimeout: 0,
        // WaitTimeSeconds: 0
    };

    try {
        const data = await sqs.receiveMessage(params).promise();
        var results = [];
        if (data.Messages != undefined) {
            for (const message of data.Messages) {
                const {
                    MessageId,
                    ReceiptHandle,
                    MD5OfBody,
                    Body
                } = message

                const {
                    ApproximateReceiveCount,
                    ApproximateFirstReceiveTimestamp,
                    MessageDeduplicationId,
                    MessageGroupId,
                    SenderId,
                    SentTimestamp,
                    SequenceNumber
                } = message.Attributes

                const result = {
                    "MessageId": `${MessageId}`,
                    "ReceiptHandle": `${ReceiptHandle}`,
                    "MD5OfBody": `${MD5OfBody}`,
                    "Body": `${Body}`,
                    "Attributes": {
                        "ApproximateReceiveCount": `${ApproximateReceiveCount}`,
                        "ApproximateFirstReceiveTimestamp": `${ApproximateFirstReceiveTimestamp}`,
                        "MessageDeduplicationId": `${MessageDeduplicationId}`,
                        "MessageGroupId": `${MessageGroupId}`,
                        "SenderId": `${SenderId}`,
                        "SentTimestamp": `${SentTimestamp}`,
                        "SequenceNumber": `${SequenceNumber}`
                    }
                };
                results.push(result);
            }
            res.status(200).json(results);
        } else {
            res.status(200).json([{
                "Body": "No Messages Found",
                "Attributes": {
                    "ApproximateReceiveCount": "0"
                }
            }]);
        }
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

// Uncomment out for local
app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for Local
// module.exports.handler = serverless(app);