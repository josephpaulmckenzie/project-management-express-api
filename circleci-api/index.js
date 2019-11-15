const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const circleCiAuth = async (circlecitoken) => {
    console.log("Setting the configuration for the circleci API")
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
        // At this point we have no idea who the user is until we verify the
        // CircleCiconfig has a valid circlecitoken and correct headers set
        console.log(`Attempting to get account details for the circlecitoken entered`)
        res = await fetch(`https://circleci.com/api/v2/me`, circleCiconfig)
        // We have to check for a status code because a non 200 code will not throw an error on its own and
        //  expects us to handle it ourselves
        if (res.status !== 200) {
            throw new Error(`The CircleCi circlecitoken was ${res.statusText}`)
        }
        // We have successfully authenticated with the circleci api. We can now return basic account details
        const accountDetails = await res.json()
        const {
            name,
            login,
            id
        } = accountDetails
        console.log(`Hi ${name} To better assist you I've retrieved your name,login which is ${login} and id ${id} from CircleCi`)
        // waits for complete response before returning results
        return { accountDetails: accountDetails, statusCode: res.status }
    } catch (error) {
        // We want to send the status code from the response from here because if we use the response from the route it will return 
        // a 200. This is because the route returned successfully even the response from circleci was not what  we expected 
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
        res.status(error.statusCode).send({ "errorMessage": error.message, "statusCode": res.statusCode });
        return next(error.message);
    }
});

const port = process.env.PORT || 3002;
app.listen(port, () =>
    console.log(`App listening on port ${port}!`));