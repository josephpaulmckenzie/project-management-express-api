

This is a collection of api's that I made to better manage my serverless ( and more ) 
architecure on AWs and github.

The following apis our available:
    1. Github Api.
        A. List Repos on personal and organization accounts
        B. List Commits on repos (both personal and organization accounts)
            1. List commits on repo as a whole
            2. List commits on repo based on username search
    2. AWS Apis.
        A. Lambda
            1. List lambdas in specified region 
            2. Update description on individual lambda
            3. Lambda Concurrency 
                1. Get current concurrency 
                    1. Account wide
                    2. Individual Lambda
                2. Update Concurrency 
                    1. Individual Lambda
            4. Lambda environmental variables 
                1. List environmental variables on individual lambda
                2. Update current environmental variables on individual lambda
                3. Create new environmental variables on individual lambda
            5. Invoke Lambda
                1. Invoke lambda with or without test event.
            6. Cloudwatch logs
                1. Get the latest logs for individual lambda 
        B. Cloudwatch
            1. List Cloudwatch log groups
            2. List Cloudwatch streams
                1. List logs in individual streams 
        C. EC2 
        D. SQS
       

    

