var AWS = require("aws-sdk");
const serverless = require('serverless-http');
const express = require('express');
const app = express();
app.use(express.json());
AWS.config.update({
    region: 'us-east-1'
});

app.use('/github-events', async (req, res) => {

    const sqs = new AWS.SQS({
        apiVersion: '2012-11-05'
    });

    const wholething = req.body;
    const commits = wholething.commits[0];
    const message = commits.message;
    const timestamp = commits.timestamp;
    const commiter = commits.committer;
    // const name = commiter.name;
    const username = commiter.username;
    // const email = commiter.email;
    const repository = wholething.repository;
    const reponame = repository.name;
    // const private = repository.private;
    // const repoowner = repository.owner;
    // const repoownername = repoowner.name;
    // const repoowneremail = repoowner.email;


    const authorAndRepoName = reponame + " " + username;

    const params = {
        MessageBody: `{"username":"${authorAndRepoName}","message":"${message}"}`,
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/897081831802/update-dynamodb-with-app-messages"
    };

    try {
        const data = sqs.sendMessage(params).promise();
        console.log(data);
        res.status(200).json(data);
        return data;
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
    console.log("Sending Github event data to be updated in dynamo");
});

app.use('/cloud-watch-alerts', async (req, res) => {

    // console.log("req",req.body);
    // console.log("res",res);
    // var file = req.files.seed;
    var obj = JSON.parse(req.body.toString('ascii'));
    console.log("obj", obj)
    console.log("Subject", obj.Subject);
    // var EventSource = event.Subject;
    // var messagebody = event.Message
    // var messagejson = JSON.parse(messagebody)
    // var AlarmDescription = messagejson.AlarmDescription;
    // var AlarmName = messagejson.AlarmName;

    var AlarmName = JSON.stringify(obj.Subject);
    var AlarmDescription = JSON.stringify(obj.Message);

    var sqs = new AWS.SQS({
        apiVersion: '2012-11-05'
    });
    var params = {
        MessageBody: `{"username":"${AlarmName}","message":"${AlarmDescription}"}`,
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/897081831802/update-dynamodb-with-app-messages"
    };
    try {
        const data = sqs.sendMessage(params).promise()
        console.log(data);
        res.status(200).json(data);
        return data;
    } catch (error) {
        res.status(400).json({
            error: err.message
        });
    }
});

// UnComment out for local
app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for Local
// module.exports.handler = serverless(app);