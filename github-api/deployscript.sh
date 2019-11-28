echo "Formatting Files"
prettier --write \"src/*.ts\" \"lib/*.js\"
sleep 5
echo "Formatted Files"
echo "Linting Files"
tslint -p tsconfig.json
sleep 5
echo "Linted Files"
echo "Testing Files"
jest
sleep 5
echo "Tested Files"
echo "Compiling Files into commonjs from typescript"
tsc
sleep 5
echo "Compiled Files into commonjs from typescript"
echo "Deploying Stack to AWS"
sls deploy