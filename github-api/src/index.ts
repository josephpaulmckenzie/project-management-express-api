import logger from "custom-logging-and-alerts"
// import fetch from "node-fetch"
import fetch, { Response } from 'node-fetch';

interface GithubAuthInterface {
    method: string
    headers: {
        'Accept': string,
        'Content-Type': string,
        'user-agent': string,
        'Authorization': string
    }
}

const githubAuth = (githubUsername: string, githubToken: string): GithubAuthInterface => {
    logger.info("Setting up the configuration for the Github API")
    // Takes in a string of the username and the token and converts it to a bae64 (or multiple other methods) encrypted string. 
    const authorization: string = 'Basic ' + new Buffer(githubUsername + ':' + githubToken, "base64")
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


// const toJson = (response: Response): Promise<object> => {
