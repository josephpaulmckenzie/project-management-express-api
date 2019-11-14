const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const githubAuth = async (githubUsername, githubToken) => {
    console.log("Setting up the configuration for the Github API")
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

const verifyRepoAndUserExists = async (githubConfig, searchforuser, githubRepo) => {
    try {
        console.log(`${searchforuser} is attempting to verify that the github repo ${githubRepo} exists`)
        res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        console.log(`${searchforuser} verified that the github repo ${githubRepo} exists`)
        return { user: await res.json(), found: res.status }
    } catch (error) {
        console.log(`Error when ${searchforuser} attempted to verify that the github repo ${githubRepo} exists ${error}`)
        throw error
    }
}

const getRepoResults = async (githubConfig, searchforuser, githubRepo) => {
    try {
        console.log(`${searchforuser} is attempting to query the github repo ${githubRepo}`)
        res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}/commits`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        console.log(`${searchforuser} successfully queried the github repo ${githubRepo}`)
        return { user: await res.json(), found: res.status }
    } catch (error) {
        console.log(`Error when ${searchforuser} attempted to query the github repo ${githubRepo} ${error}`)
        throw error
    }
}

const createGithubResultsJson = async (userResult, searchforuser, githubRepo) => {

    try {
        console.log(`Creating json response for ${searchforuser}'s repo ${githubRepo}`)
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
        console.log(`Created json response for ${searchforuser}'s repo ${githubRepo}`)
        return searchResults
    } catch (error) {
        const message = userResult.user.message || error
        throw new Error(`Error creating json response for ${searchforuser}'s repo ${githubRepo}: ${message}`)
    }
}


const checkUserType = async (githubUsername, searchforuser, githubConfig) => {
    try {
        console.log(searchforuser)
        console.log(`${githubUsername} is attempting to check the type of Github account for ${searchforuser} `)
        res = await fetch(`http://api.github.com/search/users?q=${searchforuser}`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The account entered was ${res.statusText}`)
        }
        const accountDetails = await res.json()
        console.log(accountDetails.total_count)
        if (accountDetails.total_count == 0) {
            throw new Error("No results found")
        }
        const [{
            login,
            type,
            site_admin,
            score
        }] = accountDetails.items

        // console.log("repoType:", type, "score:", score)
        console.log(`${githubUsername} checked the type of Github account for ${searchforuser} `)
        return { repoType: type, score: score }
    } catch (error) {
        // console.log(`Error ${githubUsername} checking the type of Github account for ${searchforuser} ${error}`)
        throw error
    }
}

const getReposList = async (githubConfig, githubUsername, searchforuser, accountDetails) => {
    try {
        const typeofRepo = type === "User" ? "users" : "orgs";
        console.log(`${githubUsername} is attempting to query the github account ${searchforuser}`)
        res = await fetch(`http://api.github.com/${typeofRepo}/${searchforuser}/repos?q=per_page=1000`, githubConfig)
        if (res.status !== 200) {
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        console.log(`${githubUsername} successfully queried the github account ${searchforuser}`)
        return { user: await res.json(), found: res.status }
    } catch (error) {
        console.log(`Error when ${githubUsername} attempted to query the github account ${searchforuser} ${error}`)
        throw error
    }
}

app.use('/listcommits/:searchforuser/:githubRepo', async (req, res, next) => {
    const { searchforuser, githubRepo } = req.params;
    const { githubUsername, githubToken } = req.body

    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        await verifyRepoAndUserExists(githubConfig, searchforuser, githubRepo)
        const userResult = await getRepoResults(githubConfig, searchforuser, githubRepo)
        const results = await createGithubResultsJson(userResult, searchforuser, githubRepo)
        console.log(`Returning json response for ${searchforuser}'s repo ${githubRepo} to the API`)
        res.send(results);
    } catch (error) {
        res.status(400).send({ "error": error.message });
        return next(error.message)
    }
});

app.use('/listrepos/:searchforuser', async (req, res, next) => {
    const { searchforuser } = req.params;
    const { githubUsername, githubToken } = req.body

    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        const accountDetails = await checkUserType(githubUsername, searchforuser, githubConfig)
        const repoList = await getReposList(githubConfig, githubUsername, searchforuser, accountDetails)
        res.send(repoList);
    } catch (error) {
        res.status(400).send({ "error": error.message });
        return next(error.message)
    }
});

const port = process.env.PORT || 3002;
app.listen(port, () =>
    console.log(`App listening on port ${port}!`));