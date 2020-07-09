# qTest Custom API tool for Cucumber JS reports

This node JS script is built from / inspired by the [QA Symphony Samples](https://github.com/QASymphony/qtest-api-samples), specifically the [Node Newman sample](https://github.com/QASymphony/qtest-api-samples/tree/master/node).

The difference is that this script is meant specifically for Cucumber JSON reports rather than Newman. Other differences include the ability to automatically create Test Cases and Test Runs from the Scenario names in the Cucumber reports. After that it will update executions into the correct Test Runs for each execution. Credentials are supported in a JSON file or using environment variables. Ideally in the future it will be possible to specify a Test Suite but this is a starting point.

## Set-up

To enable this script to run, qTest must be configured appropriately first.

1. Ensure automation is turned on.
2. Remove the validation that each Test Case must be linked to a Requirement for the user running the script.

`Install Node JS & NPM globally`

Run `npm install` in the root directory.

## Usage

```
-f file             Test result file
-c credentials      The file that has the appropriate qTest Credentials for this script.
                    It should be json content like:
                    {
                    email: "Elise",
                    password: "password",
                    qtesturl: "https://qas.qtestnet.com",
                    project: "API Automation Integration Demo Project"
                    }
                    If you are not supplying a credentials file then those variables must be defined in the environment
```

## Example

`node .\uploadToQTest.js -f .\cucumber-report.json -c .\creds.json`

Note: A sample cucumber-report.json file is included as an example but you should obviously define your own Cucumber JS tests and use output from them.
