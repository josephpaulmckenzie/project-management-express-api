const serverless = require('serverless-http');
const express = require('express');
const fetch = require('node-fetch');
const logger = require('./logerror').format
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const githubAuth = async (githubUsername, githubToken) => {
    logger("Info", "Setting up the configuration for the Github API")
    const auth = 'Basic ' + new Buffer.from(githubUsername + ':' + githubToken).toString('base64');
    const config = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'user-agent': githubUsername,
            'Authorization': auth
        },
    }
    return config
}

// First checks to make sure account exists and then will return account details containing account type,Github score,site_admin status and more.
const getAccountDetails = async (githubUsername, searchforuser, githubConfig) => {
    try {
        logger("Info", `${githubUsername} is attempting to check the type of Github account for ${searchforuser} `)
        res = await fetch(`http://api.github.com/search/users?q=${searchforuser}`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The account entered was ${res.statusText}`)
        }
        const accountDetails = await res.json()
        logger("Info", "Accounts: ", accountDetails.total_count)
        // If no results are found from searching the username/organization name 
        // then stop here and alert user
        if (accountDetails.total_count == 0) {
            throw new Error(`No Github account found for ${searchforuser} `)
        }
        // We can use destructuring to get the values for the json hash within the array
        // making it look cleaner and use less code. 
        const [{
            login,
            type,
            organizations_url,
            site_admin,
            score
        }] = accountDetails.items

        logger("Info", `${githubUsername} checked the type of Github account for ${searchforuser} `)
        return { repoType: type, score: score }
    } catch (error) {
        logger("Error", error.message)
        throw error
    }
}

// Will get a list of repos for specified user or organization 
const getReposList = async (githubConfig, githubUsername, searchforuser, accountDetails) => {
    try {
        // Using the account type from when we ran getAccountDetails we can say what endpoint to use
        // to retrieve the repo list . If the account type is "User" the we want to use "users" and
        // if account type is "organization" then we use "orgs"
        const accountType = accountDetails.repoType === "User" ? "users" : "orgs";
        logger("Info", `${githubUsername} is attempting to query the github account ${searchforuser}`)
        res = await fetch(`http://api.github.com/${accountType}/${searchforuser}/repos?q=per_page=1000`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        logger("Info", `${githubUsername} successfully queried the github account ${searchforuser}`)
        return { user: await res.json(), found: res.status }
    } catch (error) {
        logger("Error", error.message)
        throw error
    }
}

// Since We have successfully verified above that the account exists now we want to check to make sure the repo exists as well 
const verifyRepoExists = async (githubConfig, searchforuser, githubRepo) => {
    try {
        logger("Info", `${searchforuser} is attempting to verify that the github repo ${githubRepo} exists`)
        res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}`, githubConfig)
        // We have to check for a status code because a non 200 code will not throw an error on its own
        if (res.status !== 200) {
            throw new Error(`The Repo ${githubRepo} in ${searchforuser} was ${res.statusText}`)
        }
        logger("Info", `${searchforuser} verified that the github repo ${githubRepo} exists`)
        // waits for complete response before returning results
        return { user: await res.json(), found: res.status }
    } catch (error) {
        logger("Error", error.message)
        throw error
    }
}



const getRepoResultsFromSearch = async (githubConfig, searchforuser, githubRepo) => {
    try {
        logger("Info", `${searchforuser} is attempting to query the github repo ${githubRepo}`)
        res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}/commits`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        logger("Info", `${searchforuser} successfully queried the github repo ${githubRepo}`)
        return { user: await res.json(), found: res.status }
    } catch (error) {
        logger("Error", error.message)
        throw error
    }
}

// Now that we have the response back from the Github API we can make the hash containing just the details we want
const createGithubResultsJson = async (userResult, searchforuser, githubRepo) => {
    try {
        logger("Info", `Creating json response for ${searchforuser}'s repo ${githubRepo}`)
        const searchResults = await userResult.user.map(d => (
            {
                "repo": githubRepo,
                "loginId": `${d.author.login}`,
                "commiterEmail": `${d.commit.author.email}`,
                "commitDate": `${d.commit.author.date}`,
                "commitMessage": `${d.commit.message}`,
                "sha": `${d.sha}`

            }
        ));

        logger("Info", `Created json response for ${searchforuser}'s repo ${githubRepo}`)
        return searchResults
    } catch (error) {
        const message = userResult.user.message || error
        logger("Error", message)
        throw error
    }
}


app.use('/listcommits/:searchforuser/:githubRepo', async (req, res, next) => {
    const { searchforuser, githubRepo } = req.params;
    const { githubUsername, githubToken } = req.body
    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        await getAccountDetails(githubUsername, searchforuser, githubConfig)
        await verifyRepoExists(githubConfig, searchforuser, githubRepo)
        const userResult = await getRepoResultsFromSearch(githubConfig, searchforuser, githubRepo)
        const results = await createGithubResultsJson(userResult, searchforuser, githubRepo)
        logger("Info", `Returning json response for ${searchforuser}'s repo ${githubRepo} to the API`)
        res.send(results);
    } catch (error) {
        res.status(400).end({ "error": error.message });
    }
});

app.use('/listrepos/:searchforuser', async (req, res, next) => {
    const { searchforuser } = req.params;
    const { githubUsername, githubToken } = req.body

    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        const accountDetails = await getAccountDetails(githubUsername, searchforuser, githubConfig)
        const repoList = await getReposList(githubConfig, githubUsername, searchforuser, accountDetails)
        res.send(repoList);
    } catch (error) {
        res.status(400).end(error.message);
    }
});

// const port = process.env.PORT || 3002;
// app.listen(port, () =>
//     console.log(`App listening on port ${port}!`));


// Comment out for local
module.exports.handler = serverless(app);
