const AWS = require("aws-sdk");
const serverless = require('serverless-http');
const express = require('express');
const dateFormat = require('dateformat');
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
    return lambda = new AWS.Lambda();
}

app.use('/list-lambdas', async (req, res) => {

    updateAwsKeys(req)
    const params = {
        FunctionVersion: "ALL",
        //Marker: '',
        // MaxItems: 10
    };
    const results = [];

    try {
        console.log("Attempting to retrieve a list of lambdas in the specified account region")
        const data = await lambda.listFunctions(params).promise()
        console.log("Retrieved a list of lambdas from the specified account region")

        for (const functions of data.Functions) {
            const {
                FunctionName,
                FunctionArn,
                Runtime,
                Role,
                Description,
                LastModified,
                Version,
                Environment = data.Functions.Environment === null || typeof undefined ? "No Environmental Variables Found" : Environment
            } = functions

            const result = {
                "functionName": `${FunctionName}`,
                "functionArn": `${FunctionArn}`,
                "functionRuntime": `${Runtime}`,
                "functionRole": `${Role}`,
                "functionDescription": `${Description}`,
                "functionLastModified": `${LastModified}`,
                "functionEnvironment": `${Environment}`
            };
            if (Version == '$LATEST') {
                results.push(result);
                return res.status(200).json(results);
            } else {
                console.log(`Error retrieving the most recent details for the lambda ${FunctionName} `)
                res.status(400).json({
                    error: `Error retrieving the latest version details for the lambda ${FunctionName}`
                });
            }
        }
    } catch (error) {
        console.log(`Error retrieving a list of lambdas`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/get-lambda-concurrency', async (req, res) => {
    updateAwsKeys(req)

    try {
        console.log("Attempting to retrieve accounts UnreservedConcurrentExecutions")
        const data = await lambda.getAccountSettings({}).promise()
        console.log("Retrieved accounts UnreservedConcurrentExecutions")
        UnreservedConcurrentExecutions = data.AccountLimit.UnreservedConcurrentExecutions
    } catch (error) {
        console.log(`Error retrieving accounts UnreservedConcurrentExecutions, ${error}`)
    }

    try {
        console.log(`Attempting to retrieve ${req.body.FunctionName} UnreservedConcurrentExecutions`)
        const params = {
            FunctionName: req.body.FunctionName
        };

        const data = await lambda.getFunction(params).promise()
        console.log(data.Concurrency)
        const ReservedConcurrentExecutions = data.Concurrency.ReservedConcurrentExecutions === undefined ? "Unreserved" : data.Concurrency.ReservedConcurrentExecutions
        const results = {
            "ReservedConcurrentExecutions": `${ReservedConcurrentExecutions}`,
            "UnreservedConcurrentExecutions": `${UnreservedConcurrentExecutions}`
        };
        console.log(`Successfully retrieved ${req.body.FunctionName} UnreservedConcurrentExecutions`)
        res.status(200).json(results);
    } catch (error) {
        console.log(`Error retrieving ${req.body.FunctionName} UnreservedConcurrentExecutions, ${error}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/update-lambda-concurrency', async (req, res) => {
    updateAwsKeys(req)

    try {
        const {
            FunctionName,
            ReservedConcurrentExecutions
        } = req.body

        const params = {
            FunctionName: FunctionName,
            ReservedConcurrentExecutions: ReservedConcurrentExecutions
        };
        await lambda.putFunctionConcurrency(params).promise()
        console.log(`Updated ${FunctionName}'s ReservedConcurrentExecutions`)
        res.status(200).json({ "FunctionName": FunctionName, "ReservedConcurrentExecutions": ReservedConcurrentExecutions });
    } catch (error) {
        console.log(`Error updating ${FunctionName}'s ReservedConcurrentExecutions`)
        res.status(400).json({
            error: `Error retrieving the latest version details for the lambda ${FunctionName}`
        });
    }
});


app.use('/update-lambda-description', async (req, res) => {
    updateAwsKeys(req)
    try {
        const {
            FunctionName,
            lambdaDescription
        } = req.body
        var params = {
            FunctionName: FunctionName,
            Description: lambdaDescription
        };
        console.log(`Attempting to update ${FunctionName}'s description`)
        await lambda.updateFunctionConfiguration(params).promise()
        console.log(`Updated ${FunctionName}'s description`)
        res.status(200).json({ "FunctionName": FunctionName, "Description": lambdaDescription });
    } catch (error) {
        console.log(`Error attempting to update  description, ${error}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/get-lambda-envs', async (req, res) => {
    updateAwsKeys(req)
    const FunctionName = req.body.FunctionName;
    const params = {
        FunctionName: FunctionName
    };
    try {
        const envs = [];
        const data = await lambda.getFunction(params).promise()
        if (data.Configuration.Environment == undefined) {
            res.status(200).json("No environmental variables found");
        } else {
            res.status(200).json(data.Configuration.Environment.Variables);
        }
    } catch (error) {
        console.log(`Error attempting to retrieve environmental variables, ${error}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/update-lambda-envs', async (req, res) => {
    updateAwsKeys(req)
    const {
        FunctionName,
        envs
    } = req.body
    const params = {
        FunctionName: FunctionName,
        Environment: {
            Variables: envs
        }
    };

    try {
        console.log(`Attempting to update ${FunctionName} environmental variables`)
        const data = await lambda.updateFunctionConfiguration(params).promise()
        console.log(`Updated ${FunctionName} environmental variables`)
        res.status(200).json(data);
    } catch (error) {
        console.log(`Error when attempting to update ${FunctionName} environmental variables, ${error}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/invoke-lambda', async (req, res) => {
    updateAwsKeys(req)
    const FunctionName = req.body.FunctionName
    const testEvent = req.body.testEvent
    // testEvent = JSON.stringify(testEvent);
    const params = {
        FunctionName: FunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: `${testEvent}`
    };

    try {
        console.log(`Attempting to invoke ${FunctionName}`)
        const data = await lambda.invoke(params).promise()
        console.log(`Invoked ${FunctionName}`)
        res.status(200).json(data.Payload);
    } catch (error) {
        console.log(`Error attempting to invoke ${FunctionName}`)
        res.status(400).json({
            error: error.message
        });
    }
});

app.use('/get-cloudwatch-logs', async (req, res) => {
    updateAwsKeys(req)
    const cwl = new AWS.CloudWatchLogs({
        apiVersion: '2014-03-28'
    });
    const logGroupName = req.body.logGroupName;
    console.log("logGroupName", logGroupName)
    const params = {
        logGroupName: `/aws/lambda/${logGroupName}`,
        descending: true, //|| false,
        limit: 1,
        // logStreamNamePrefix: 'STRING_VALUE',
        // nextToken: 'STRING_VALUE',
        orderBy: 'LastEventTime' // | LogStreamName 
    };

    try {
        const data = await cwl.describeLogStreams(params).promise()
        for (const logStream of data.logStreams) {
            // console.log(logStream, "data!!!!")

            var logStreamName = logStream.logStreamName;
            var creationTime = logStream.creationTime;
            creationTime = dateFormat(new Date(creationTime), "mm-dd-yyyy h:MM:ss");
            var firstEventTimestamp = logStream.firstEventTimestamp;
            firstEventTimestamp = dateFormat(new Date(firstEventTimestamp), "mm-dd-yyyy h:MM:ss");
            var lastEventTimestamp = logStream.lastEventTimestamp;
            lastEventTimestamp = dateFormat(new Date(lastEventTimestamp), "mm-dd-yyyy h:MM:ss");
            const results = await getCloudwatchLogs(logGroupName, logStreamName);
            res.status(200).json(results);

        }
    } catch (error) {
        res.status(404).json([{
            "timestamp": "",
            "message": "Error when searching for lambda logs"
        }]);
    }
});


const getCloudwatchLogs = async (logGroupName, logStreamName) => {
    const cwl = new AWS.CloudWatchLogs({
        apiVersion: '2014-03-28'
    });
    const params = {
        logGroupName: `/aws/lambda/${logGroupName}`,
        logStreamName: logStreamName
    };
    const results = [];

    try {
        console.log("Attempting to retrieve cloudwatch logs")
        const data = await cwl.getLogEvents(params).promise()
        for (const events of data.events) {
            let timestamp = events.timestamp;
            timestamp = dateFormat(new Date(timestamp), "mm-dd-yyyy h:MM:ss");
            const message = events.message;
            const result = {
                "timestamp": `${timestamp}`,
                "message": `${message}`
            };
            results.push(result);
        }
        console.log("Retrieved cloudwatch logs")
        return results
    } catch (error) {
        console.log("Error when attempting to retrieve cloudwatch logs", error)
        throw error
    }
}

// Uncomment For Local 
app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for local
// module.exports.handler = serverless(app);