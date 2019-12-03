"use strict";
require("dotenv").config();
const logger = require("custom-logging-and-alerts");
const fetch = require("node-fetch");

const githubAuth = (githubUsername, githubToken) => {
    const token = process.env.authorization || githubToken;
    logger.info("Setting up the configuration for the Github API");
    // Takes in a string of the username and the token and converts it to a bae64 (or multiple other methods) encrypted string.
    const authorization = "Basic " + Buffer.from(githubUsername + ":" + token).toString("base64");
    const config = {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "user-agent": githubUsername,
            Authorization: authorization
        }
    };
    return config;
};

// First checks to make sure account exists and then will return account details containing account type,Github score,site_admin status and more.
const getAccountDetails = async (githubUsername, searchforuser, githubConfig) => {
    let statusCode;
    try {
        logger.info(`${githubUsername} is attempting to check the type of Github account for ${searchforuser}`);
        const res = await fetch(`http://api.github.com/search/users?q=${searchforuser}`, githubConfig);
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The account entered was ${res.statusText}`);
        }
        const accountDetails = await res.json();
        logger.info("Accounts: ", accountDetails.total_count);
        // If no results are found from searching the username/organization name
        // then stop here and alert user
        if (accountDetails.total_count === 0) {
            statusCode = 404;
            throw new Error(`No Github account found for ${searchforuser}`);
        }
        // We can use destructuring to get the values for the json hash within the array
        // making it look cleaner and use less code.
        const { login, type, organizations_url, site_admin, score } = accountDetails.items[0];
        logger.info(`${githubUsername} checked the type of Github account for ${searchforuser}`);
        return { type, score };
    }
    catch (error) {
        // We cannot assign a type to error because it could be anything thrown in to this from strings to objects to whatever
        logger.error(error.message, statusCode);
        throw { message: error.message, statusCode };
    }

};

const getReposList = async (githubConfig, githubUsername, searchforuser, accountDetails) => {
    let statusCode;
    try {
        // Using the account type from when we ran getAccountDetails we can say what endpoint to use
        // to retrieve the repo list . If the account type is "User" the we want to use "users" and
        // if account type is "organization" then we use "orgs"
        const type = accountDetails.type;
        const accountType = type === "User" ? "users" : "orgs";
        logger.info(`${githubUsername} is attempting to query the github account ${searchforuser}`);
        const res = await fetch(`http://api.github.com/${accountType}/${searchforuser}/repos?q=per_page=1000`, githubConfig);
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Username or Repo entered was ${res.statusText}`);
        }
        logger.info(`${githubUsername} successfully queried the github account ${searchforuser}`);
        return { user: await res.json(), statusCode: res.status };
    }
    catch (error) {
        logger.error(error.message);
        throw { message: error.message, statusCode };
    }
};
// Since We have successfully verified above that the account exists now we want to check to make sure the repo exists as well
const verifyRepoExists = async (githubConfig, searchforuser, githubRepo) => {
    let statusCode;
    try {
        logger.info(`${searchforuser} is attempting to verify that the github repo ${githubRepo} exists`);
        const res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}`, githubConfig);
        // We have to check for a status code because a non 200 code will not throw an error on its own
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Repo ${githubRepo} in ${searchforuser} was ${res.statusText}`);
        }
        logger.info(`${searchforuser} verified that the github repo ${githubRepo} exists`);
        // waits for complete response before returning results
        return { user: await res.json(), found: res.status };
    }
    catch (error) {
        logger.error(error.message);
        throw { message: error.message, statusCode };
    }
};

const getRepoResultsFromSearch = async (githubConfig, searchforuser, githubRepo) => {
    let statusCode;
    try {
        logger.info(`${searchforuser} is attempting to query the github repo ${githubRepo}`);
        const res = await fetch(`https://api.github.com/repos/${searchforuser}/${githubRepo}/commits`, githubConfig);
        if (res.status !== 200) {
            statusCode = res.status;
            throw new Error(`The Username or Repo entered was ${res.statusText}`);
        }
        logger.info(`${searchforuser} successfully queried the github repo ${githubRepo}`);
        return { user: await res.json(), statusCode: res.status };
    }
    catch (error) {
        logger.error(error.message);
        throw { message: error.message, statusCode };
    }
};
// Now that we have the response back from the Github API we can make the hash containing just the details we want
const createGithubResultsJson = async (userResult, searchforuser, githubRepo) => {
    try {
        logger.info(`Creating json response for ${searchforuser}'s repo ${githubRepo}`);
        const searchResults = await userResult.user.map((github) => ({
            repoName: githubRepo,
            loginId: github.commit.committer.Id,
            committerEmail: `${github.commit.author.email}`,
            commitDate: `${github.commit.author.date}`,
            commitMessage: `${github.commit.message}`,
            sha: `${github.sha}`
        }));

        logger.info(`Created json response for ${searchforuser}'s repo ${githubRepo}`);

        return searchResults;
    }
    catch (error) {
        const message = userResult.user.message || error;
        logger.error(message);
        throw { message, statusCode: 400 };
    }
};
const listcommits = async (pathParameters, body) => {
    try {
        const { searchforuser, githubRepo } = pathParameters;
        const { githubUsername, githubToken } = body;
        const githubConfig = await githubAuth(githubUsername, githubToken);
        await getAccountDetails(githubUsername, searchforuser, githubConfig);
        const userResult = await getRepoResultsFromSearch(githubConfig, searchforuser, githubRepo);
        const results = await createGithubResultsJson(userResult, searchforuser, githubRepo);
        logger.info(`Returning json response for ${searchforuser}'s repo ${githubRepo} to the API`);
        return results;
    }
    catch (error) {
        logger.error(error);
        return error.message;
    }
};
const listrepos = async (pathParameters, body) => {
    const githubUserDetails = JSON.parse(body);
    const githubSearchDetails = pathParameters;
    const { githubUsername, githubToken } = githubUserDetails;
    const { searchforuser, githubRepo } = githubSearchDetails;
    try {
        const githubConfig = await githubAuth(githubUsername, githubToken);
        const accountDetails = await getAccountDetails(githubUsername, searchforuser, githubConfig);
        const repoList = await getReposList(githubConfig, githubUsername, searchforuser, accountDetails);
        return repoList;
    }
    catch (error) {
        console.log(error);
        return error;
    }
};

exports.handler = async (event) => {
    // event.context['http-method']
    console.log(event);
    const { pathParameters, body } = event;
    console.log("pathParameters", pathParameters);
    console.log("body", body);
    const path = event.path.split("/")[1];
    console.log("path", path);
    if (path === "listrepos") {
        const listreposResponse = await listrepos(pathParameters, body);
        return {
            statusCode: listreposResponse.statusCode,
            body: JSON.stringify(listreposResponse),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
    else if (path === "listcommits") {
        const listcommitsResponse = await listcommits(pathParameters, body);
        return {
            statusCode: listcommitsResponse.statusCode,
            body: JSON.stringify(listcommitsResponse),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
    else {
        return {
            statusCode: 404,
            body: JSON.stringify({ "message": "Route not found" }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
    // return body
};

module.exports.githubAuth = githubAuth;
module.exports.getAccountDetails = getAccountDetails;
module.exports.getReposList = getReposList;
module.exports.verifyRepoExists = verifyRepoExists;
module.exports.getRepoResultsFromSearch = getRepoResultsFromSearch;
module.exports.createGithubResultsJson = createGithubResultsJson;
//# sourceMappingURL=index.js.map

const hello = async () => {

    const auth = githubAuth(process.env.userAgent, process.env.authorization);
    await verifyRepoExists(auth, process.env.userAgent, "project-management-typescript-api");
    const userResult = await getRepoResultsFromSearch(auth, process.env.userAgent, "project-management-typescript-api");
    const results = await createGithubResultsJson(userResult, process.env.userAgent, "project-management-typescript-api");
    console.log(results[0].commitMessage)
}

hello();