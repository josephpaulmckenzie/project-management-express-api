# /!/bin/bash 


if [ "master" == "master" ]; then
# Identify modified directories
LAST_SUCCESSFUL_BUILD_URL="https://circleci.com/api/v1.1/project/github/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/tree/$CIRCLE_BRANCH?filter=completed&limit=1"
LAST_SUCCESSFUL_COMMIT=`curl -Ss -u "$CIRCLE_TOKEN:" $LAST_SUCCESSFUL_BUILD_URL | jq -r '.[0]["vcs_revision"]'`
#first commit in a branch
if [[ ${LAST_SUCCESSFUL_COMMIT} == "null" ]]; then
COMMITS="origin/master"
else
COMMITS="${CIRCLE_SHA1}..${LAST_SUCCESSFUL_COMMIT}"
fi

git diff --name-only $COMMITS | cut -d/ -f1 | sort -u > projects
echo -e "Modified directories:\n`cat projects`\n"

echo -e "get working directory"
pwd

echo -e "get file list"
ls -la

projects_inc_dep=(`cat projects`)

echo -e "Building: ${projects_inc_dep[@]}\n"
for project in ${projects_inc_dep[@]}; do
if grep -Fxq $project build-directories.txt; then
printf "\nTriggerring build for project: "$project
curl -s -u ${CIRCLE_TOKEN}: \
-d build_parameters[CIRCLE_JOB]=${project} \
https://circleci.com/api/v1.1/project/github/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/tree/$CIRCLE_BRANCH
fi
done
else
echo -e "Not master branch, did not run circleci build process"
fi