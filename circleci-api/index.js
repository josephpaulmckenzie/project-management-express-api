const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const circleCiAuth = async (circlecitoken) => {
    console.log("Setting up the configuration for the circleci API")
    const CircleCiconfig = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Circle-Token': circlecitoken
        },
    }
    return CircleCiconfig
}


const circleciUserDetails = async (circleCiconfig) => {
    let res
    try {
        console.log(`Attempting to get account details for the circleci account entered`)
        res = await fetch(`https://circleci.com/api/v2/me`, circleCiconfig)
        // We have to check for a status code because a non 200 code will not throw an error on its own
        if (res.status !== 200) {
            throw new Error(`The CircleCi account was ${res.statusText}`)
        }
        console.log(`Retrieved account details for the circleci account entered`)
        // waits for complete response before returning results
        return { accountDetails: await res.json(), statusCode: res.status }
    } catch (error) {
        throw { message: error.message, statusCode: res.status }
    }
}

app.use("/accountdetails", async (req, res, next) => {
    const {
        circlecitoken
    } = req.headers

    try {
        const circleCiconfig = await circleCiAuth(circlecitoken);
        const accountDetails = await circleciUserDetails(circleCiconfig)
        res.status(accountDetails.statusCode).json(accountDetails);
    } catch (error) {
        res.status(error.statusCode).send({ "errorMessage": error.message, "statusCode": error.statusCode });
        return next(error.message);
    }
});

const port = process.env.PORT || 3002;
app.listen(port, () =>
    console.log(`App listening on port ${port}!`));