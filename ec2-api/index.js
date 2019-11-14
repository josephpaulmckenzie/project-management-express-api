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
    return ec2 = new AWS.EC2();
}

app.use("/list-ec2-instances", async (req, res) => {
    try {
        updateAwsKeys(req)
        console.log("Attempting to retrieve a list of ec2 instances")
        const data = await ec2.describeInstances({}).promise()
        console.log("Retrieved a list of ec2 instances")
        return res.status(200).json(data);
    } catch (error) {
        console.log(`Error attempting to retrieve a list of ec2 instances, ${error.message}`)
        res.status(error.statusCode).json({
            error: error.message
        });
    }
});

app.use('/start-ec2-instances', async (req, res) => {
    updateAwsKeys(req)
    const instanceId = req.body.InstanceIds
    const params = {
        InstanceIds: [
            InstanceIds,
        ],
    };
    try {
        console.log(`Attempting to start ec2 instance ${instanceId}`)
        const data = await ec2.startInstances(params).promise();
        console.log(`Started ec2 instance ${instanceId}`)
        return res.status(200).json(data);
    } catch (error) {
        console.log(`Error attempting to start ec2 instance ${instanceId}`)
        return res.status(error.statusCode).json({
            error: error.message
        });
    }
});

app.use('/stop-ec2-instances', async (req, res) => {
    updateAwsKeys(req)

    const instanceId = req.body.InstanceIds
    const params = {
        InstanceIds: [
            instanceId,
        ],
    };


    try {
        console.log(`Attempting to stop ec2 instance ${instanceId}`)
        const data = await ec2.stopInstances(params).promise()
        console.log(`Stopping ec2 instance ${instanceId}`)
        return res.status(200).json(data);
    } catch (error) {
        console.log(`Error stopping ec2 instance ${instanceId}, ${error}`)
        res.status(error.statusCode).json({
            error: error.message
        });
    }
});

// Uncomment For Local 
app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for local
// module.exports.handler = serverless(app);

