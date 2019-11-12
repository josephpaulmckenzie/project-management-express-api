const serverless = require('serverless-http');
const https = require("https");
const express = require('express');
const app = express();

app.use(express.json());


const githubAuth = async (req) => {
    const {
        githubusername,
        githubpassword,
        github_organization

    } = req.body

    if (github_organization == githubusername) {
        const auth = 'Basic ' + new Buffer.from(githubusername + ':' + githubpassword).toString('base64');
        const options = {
            host: 'api.github.com',
            path: `/user/repos?per_page=1000&type=owner`,
            method: 'GET',
            headers: {
                'user-agent': 'node.js',
                'Authorization': auth
            }
        };
        return { "options": options, "githubusername": githubusername, "github_organization": github_organization }
    } else {
        const auth = 'Basic ' + new Buffer.from(githubusername + ':' + githubpassword).toString('base64');
        const options = {
            host: 'api.github.com',
            path: `/orgs/${github_organization}/repos`,
            method: 'GET',
            headers: {
                'user-agent': 'node.js',
                'Authorization': auth
            }
        };
        return { "options": options, "githubusername": githubusername, "github_organization": github_organization }
    }
}

app.use('/list-github-repos', async (req, res) => {
    const authDetails = await githubAuth(req)
    const results = [];

    const request = https.request(authDetails.options, function (response) {
        let body = '';
        response.on("data", function (chunk) {
            body += chunk.toString('utf8');
        });

        response.on("end", function () {
            const list = JSON.parse(body);
            try {
                for (const repoDetails of list) {

                    const {
                        id,
                        name,
                        private,
                        description = repoDetails.description === null || typeof undefined ? "Description" : description,
                        language
                    } = repoDetails

                    const {
                        login,
                        avatar_url,
                        html_url
                    } = repoDetails.owner

                    const result = {
                        "id": `${id}`,
                        "repoName": `${name}`,
                        "private": `${private}`,
                        "repoOwner": `${login}`,
                        "avatar_url": `${avatar_url}`,
                        "html_url": `${html_url}`,
                        "description": `${description}`,
                        "language": `${language}`
                    };
                    results.push(result);
                }
                res.status(200).json(results);
            } catch (error) {
                console.log(`Error when attempting to connect to Github: ${list.message}`)
                res.status(response.statusCode).json({
                    error: list.message
                });
            }
        });
    });
    request.end();
});

app.use('/list-github-commits', async (req, res) => {
    const authDetails = await githubAuth(req)
    const results = [];
    const {
        githubrepo,
        searchforuser
    } = req.body

    if (authDetails.github_organization == authDetails.githubusername) {
        path = `/repos/${searchforuser}/${githubrepo}/commits`
    } else {
        path = `/repos/${authDetails.github_organization}/${githubrepo}/commits`
    }
    const options = {
        host: 'api.github.com',
        path: path,
        method: 'GET',
        headers: authDetails.options.headers
    };

    const request = https.request(options, function (response) {
        let body = '';
        response.on("data", function (chunk) {
            body += chunk.toString('utf8');
        });

        response.on("end", function () {
            const list = JSON.parse(body)
            try {

                for (const commits of list) {
                    const {
                        name,
                        email,
                        date,

                    } = commits.commit.committer
                    const commitMessage = commits.commit.message;
                    const sha = commits.commit.tree.sha;
                    if (searchforuser == commits.author.login) {
                        const result = {
                            "repo": `${githubrepo}`,
                            "commiterName": `${name}`,
                            "commiterEmail": `${email}`,
                            "commitDate": `${date}`,
                            "commitMessage": `${commitMessage}`,
                            "sha": `${sha}`
                        };
                        results.push(result);
                    }
                }
                res.status(200).json(results);

            } catch (error) {
                res.status(response.statusCode).json({
                    error: list.message
                });
            }
        });
    });
    request.end();
});

// Uncomment for Local
app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for Local
// module.exports.handler = serverless(app);