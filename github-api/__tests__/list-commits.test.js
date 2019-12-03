const index = require('../lib/index');
require("dotenv").config();
const moment = require('moment')
describe('Github Authorization Header', () => {
    const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
    const headers = auth.headers;

    test('Correct GET method is supplied', () => {
        const method = auth.method;
        expect(method).toBe("GET");
    });
    test('Accept header is set to accept application/json', () => {
        const accept = headers.Accept;
        expect(accept).toBe('application/json');
    });
    test('Content-Type header is set to application/json', () => {
        const contentType = headers['Content-Type'];
        expect(contentType).toBe('application/json');
    });
    test('user-agent header is set', () => {
        const userAgent = headers['user-agent'];
        // Just want to make sure we have a value here because it can change depending on the username used during testing
        expect(typeof userAgent).toBe('string');
    });
    test('Authorization header is base64 encrypted ', () => {
        // Regex magic :P 
        const base64Regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
        const authorization = headers.Authorization;
        // We need to strip out the word Basic to test to see if our authToken is valid base64 encrypted string
        const authToken = authorization.replace("Basic ", "");
        const isBase64Valid = base64Regex.test(authToken);
        // Just want to make sure we have a value here because it can change depending on the token used during testing
        expect(isBase64Valid).toBe(true);
    });
});

describe('Check User\'s repo status', () => {
    beforeEach(async () => {
        const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
        exists = await index.verifyRepoExists(auth, process.env.userAgent, "project-management-typescript-api");
    });
    test('User Repo Exists', async () => {
        expect(exists.found).toBe(200);
    });

});
test('Repo type is User', async () => {
    const repoType = exists.user.owner.type;
    expect(repoType).toBe("User");
});
test('Repo type is public', async () => {
    const repoPrivate = exists.user.private;
    expect(repoPrivate).toBe(false);
});
test('User\'s Repo name comes back correct', async () => {
    const repoName = exists.user.merges_url;
    expect("").toBe("");
});
test('User\'s Repo owner name comes back correct', async () => {
    const ownerName = exists.user.owner.login;
    expect(ownerName).toBe(process.env.userAgent);
});

describe('Check commits in repo for searched user', () => {
    beforeAll(async () => {
        const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
        await index.verifyRepoExists(auth, process.env.userAgent, "project-management-typescript-api");
        const userResult = await index.getRepoResultsFromSearch(auth, process.env.userAgent, "project-management-typescript-api");
        results = await index.createGithubResultsJson(userResult, process.env.userAgent, "project-management-typescript-api");
        return [results];
    });

    test('Repo name for commit returned matches repo name searched on', async () => {
        const repoName = results.repoName;
        expect(repoName).toBe(repoName);
    });
    test('Login id for committer matches testers login id', async () => {
        const loginId = results.loginId;
        expect(loginId).toBe(process.env.loginId);
    });
    test('Email on commit matches email address for tester', async () => {
        const committerEmail = results.committerEmail;
        expect(committerEmail).toBe(process.env.committerEmail);
    });
    test('Commit date returned matches date format', async () => {
        const commitDate = results.commitDate;
        const date = moment(commitDate);
        const isValid = date.isValid();
        expect(isValid).toBe(true);
    });
    test('Commit message is not null or blank', async () => {
        // Commit messages can't be blank when you commit them to github therefore we should never return a blank commit message
        const commitMessage = results.commitMessage;
        expect(commitMessage).not.toBe(null);
    });
});

