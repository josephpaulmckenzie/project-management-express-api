import logger from "custom-logging-and-alerts"
// import fetch from "node-fetch"
import fetch, { Response } from 'node-fetch';
import { Url } from "url";
import { Hash } from "crypto";

interface GithubAuthInterface {

    method: string;
    headers: {
        'Accept': string,
        'Content-Type': string,
        'user-agent': string,
        'Authorization': string
    }
}

interface GithubAccountDetails {
    "total_count": number,
    "incomplete_results": boolean,
    "items": [
        {
            "login": string,
            "id": number,
            "node_id": string,
            "avatar_url": Url,
            "gravatar_id": string,
            "url": Url,
            "html_url": Url,
            "followers_url": Url,
            "following_url": Url,
            "gists_url": Url,
            "starred_url": Url,
            "subscriptions_url": Url,
            "organizations_url": Url,
            "repos_url": Url,
            "events_url": Url,
            "received_events_url": Url,
            "type": string,
            "site_admin": boolean,
            "score": number
        }
    ]
}

interface GithubResults {
    author: {
        login: string;
    };
    commit: {
        author: {
            email: string;
            date: Date;
        };
        message: string;
    };
    sha: string;
}

const githubAuth = (githubUsername: string, githubToken: string): GithubAuthInterface => {
    logger.info("Setting up the configuration for the Github API")
    // Takes in a string of the username and the token and converts it to a bae64 (or multiple other methods) encrypted string. 
    const authorization = 'Basic ' + Buffer.from(githubUsername + ':' + githubToken).toString('base64');
    const config = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'user-agent': githubUsername,
            'Authorization': authorization
        },
    }
    return config
}

// First checks to make sure account exists and then will return account details containing account type,Github score,site_admin status and more.
const getAccountDetails = async (githubUsername: string, searchForUser: string, githubConfig: GithubAuthInterface) => {
    let statusCode: number;
    try {
        logger.info(`${githubUsername} is attempting to check the type of Github account for ${searchForUser}`);
        const res: Response = await fetch(`http://api.github.com/search/users?q=${searchForUser}`, githubConfig);
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The account entered was ${res.statusText}`);
        }
        const accountDetails: GithubAccountDetails = await res.json();
        logger.info("Accounts: ", accountDetails.total_count);
        // If no results are found from searching the username/organization name 
        // then stop here and alert user
        if (accountDetails.total_count == 0) {
            statusCode = 404;
            throw new Error(`No Github account found for ${searchForUser}`);
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

        logger.info(`${githubUsername} checked the type of Github account for ${searchForUser}`)
        return { type: type, score: score }
    } catch (error) {
        // We cannot assign a type to error because it could be anything thrown in to this from strings to objects to whatever
        logger.error(error.message, statusCode)
        throw { "message": error.message, "statusCode": statusCode }
    }
}

const getReposList = async (githubConfig: GithubAuthInterface, githubUsername: string, searchForUser: string,
    accountDetails: GithubAccountDetails) => {
    let statusCode: number;
    try {
        // Using the account type from when we ran getAccountDetails we can say what endpoint to use
        // to retrieve the repo list . If the account type is "User" the we want to use "users" and
        // if account type is "organization" then we use "orgs"
        const [{
            type,
        }] = accountDetails.items
        const accountType: string = type === "User" ? "users" : "orgs";
        logger.info(`${githubUsername} is attempting to query the github account ${searchForUser}`)
        const res: Response = await fetch(`http://api.github.com/${accountType}/${searchForUser}/repos?q=per_page=1000`, githubConfig)
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        logger.info(`${githubUsername} successfully queried the github account ${searchForUser}`)
        return { user: await res.json(), statusCode: res.status }
    } catch (error) {
        logger.error(error.message)
        throw { "message": error.message, "statusCode": statusCode };
    }
}

// Since We have successfully verified above that the account exists now we want to check to make sure the repo exists as well 
const verifyRepoExists = async (githubConfig: GithubAuthInterface, searchForUser: string, githubRepo: any) => {
    let statusCode: number;
    try {
        logger.info(`${searchForUser} is attempting to verify that the github repo ${githubRepo} exists`)
        const res: Response = await fetch(`https://api.github.com/repos/${searchForUser}/${githubRepo}`, githubConfig)
        // We have to check for a status code because a non 200 code will not throw an error on its own
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Repo ${githubRepo} in ${searchForUser} was ${res.statusText}`)
        }
        logger.info(`${searchForUser} verified that the github repo ${githubRepo} exists`)
        // waits for complete response before returning results
        return { user: await res.json(), found: res.status }
    } catch (error) {
        logger.error(error.message)
        throw { "message": error.message, "statusCode": statusCode };
    }
}

const getRepoResultsFromSearch = async (githubConfig: GithubAuthInterface, searchForUser: string, githubRepo: any) => {
    let statusCode;
    try {
        logger.info(`${searchForUser} is attempting to query the github repo ${githubRepo}`)
        const res: Response = await fetch(`https://api.github.com/repos/${searchForUser}/${githubRepo}/commits`, githubConfig)
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Username or Repo entered was ${res.statusText}`)
        }
        logger.info(`${searchForUser} successfully queried the github repo ${githubRepo}`)
        return { user: await res.json(), statusCode: res.status }
    } catch (error) {
        logger.error(error.message)
        throw { "message": error.message, "statusCode": statusCode };
    }
}

// Now that we have the response back from the Github API we can make the hash containing just the details we want
const createGithubResultsJson = async (userResult: any, searchForUser: string, githubRepo: string) => {
    try {
        logger.info(`Creating json response for ${searchForUser}'s repo ${githubRepo}`)
        const searchResults: object = await userResult.user.map((github: GithubResults) => (
            {
                "repo": githubRepo,
                "loginId": `${github.author.login}`,
                "commiterEmail": `${github.commit.author.email}`,
                "commitDate": `${github.commit.author.date}`,
                "commitMessage": `${github.commit.message}`,
                "sha": `${github.sha}`

            }
        ));

        logger.info(`Created json response for ${searchForUser}'s repo ${githubRepo}`)
        return searchResults
    } catch (error) {
        const message = userResult.user.message || error
        logger.error(message)
        throw { "message": message, "statusCode": 400 };
    }
}

const listcommits = async (pathParameters: any, body: any) => {
    try {
        const { searchForUser, githubRepo } = pathParameters;
        const { githubUsername, githubToken } = body;
        const githubConfig = await githubAuth(githubUsername, githubToken);
        await getAccountDetails(githubUsername, searchForUser, githubConfig);
        await verifyRepoExists(githubConfig, searchForUser, githubRepo);
        const userResult = await getRepoResultsFromSearch(githubConfig, searchForUser, githubRepo);
        const results = await createGithubResultsJson(userResult, searchForUser, githubRepo);
        logger.info(`Returning json response for ${searchForUser}'s repo ${githubRepo} to the API`);
        return results;
    } catch (error) {
        logger.error(error);
        return error.message;
    }

};

const listrepos = async (pathParameters: any, body: any) => {
    const githubUserDetails = JSON.parse(body)
    const githubSearchDetails = pathParameters
    const { githubUsername, githubToken } = githubUserDetails
    const { searchForUser, githubRepo } = githubSearchDetails;

    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        const accountDetails: any = await getAccountDetails(githubUsername, searchForUser, githubConfig)
        const repoList = await getReposList(githubConfig, githubUsername, searchForUser, accountDetails)
        return repoList;
    } catch (error) {
        console.log(error)
        return error
    }
}

exports.handler = async function (event: any) {
    // event.context['http-method']
    console.log(event)
    const {
        pathParameters,
        body
    } = event
    console.log("pathParameters", pathParameters)
    console.log("body", body)
    const path = event.path.split("/")[1]
    console.log("path", path)
    if (path == "listrepos") {
        const listreposResponse = await listrepos(pathParameters, body)
        return {
            statusCode: listreposResponse.statusCode,
            body: JSON.stringify(listreposResponse),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    } else if (path == "listcommits") {
        const listcommitsResponse = await listcommits(pathParameters, body)
        return {
            statusCode: listcommitsResponse.statusCode,
            body: JSON.stringify(listcommitsResponse),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    } else {
        return "OHNO"
    }
    // return body
}