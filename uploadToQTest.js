const commandLineArgs = require("command-line-args");
const fetch = require("node-fetch");
const fs = require("fs");
const apiUtils = require("./utils/api-utils");
const credsHelper = require("./utils/credential-helper");

const optionDefinitions = [
  { name: "file", alias: "f", type: String },
  { name: "credentials", alias: "c", type: String },
  { name: "help", alias: "h", type: Boolean },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
  var helptext = fs.readFileSync("help.txt", "utf8");
  console.log(helptext);
  process.exit(0);
}

HandleOptions(options, function (err) {
  if (err) {
    console.log(err);
    process.exit(-1);
  }
});

const creds = credsHelper.CredentialsHelper(options.credentials);

Main(creds);

async function Main(creds) {
  const token = await Login(creds);
  FindAndUploadResults(token);
}

function FindAndUploadResults(token) {
  var executionResults = ParseResultsFile();

  executionResults.forEach(async function (run, index) {
    let testCaseId = 0;
    // Is there a matching test case for the scenario/run?
    let matchingTestCases = await GetTestCaseForScenario(run.name, token);
    //console.log('Test case search result: ', matchingTestCases);

    //  If so use it
    if (matchingTestCases.length) {
      testCaseId = matchingTestCases[0].id; // Use the first one for now
      console.log("Test case match, Id: ", testCaseId);
    }
    //  Else create one (Test case name = scenario/run.name)
    else {
      console.log("Creating new test case");
      testCaseId = apiUtils.CreateTestCaseForScenario(run, token, creds);
    }

    let testRunId = 0;
    // Is there an existing test run for the scenario/run?
    let matchingTestRuns = await GetTestRunForScenario(run.name, token);
    console.log("Test run search result: ", matchingTestRuns);

    //  If so use it
    if (matchingTestRuns.length) {
      testRunId = matchingTestRuns[0].id; // Use the first one for now
      console.log("Test run match, Id: ", testCaseId);
    }
    //  Else create one (Test run name = scenario/run.name)
    else {
      console.log("Creating new test run");
      testRunId = apiUtils.CreateTestRunForScenario(
        run.name,
        testCaseId,
        token,
        creds
      );
    }

    await UploadResults(run, testRunId, token);
  });
}

async function UploadResults(run, testRunId, token) {
  const url =
    "https://" +
    creds.url +
    "/api/v3/projects/" +
    creds.project +
    "/test-runs/" +
    testRunId +
    "/auto-test-logs";
  const body = {
    status: run.status,
    exe_start_date: new Date(),
    exe_end_date: new Date(),
    //name: item.pid + " WHERE?",
    automation_content: "Automation content",
    name: run.name,
    note: run.error ? run.error : "Successful automation run",
    //attachments: ? [{Maybe a report file or photo?}],
    test_step_logs: run.testStepLogs,
  };

  const response = await apiUtils.PostToApi(url, body, token);
  console.log(response);

  if (response.message) {
    HandleErrorAndExit(
      "Error uploading test result with values : " +
        JSON.stringify(body) +
        "\n\nERROR: " +
        response.message
    );
  }

  console.log(
    "Successfully uploaded test case [" +
      run.name +
      "] with status " +
      run.status +
      " to test run id: + " +
      response.id +
      " and test case version id: " +
      response.test_case_version_id
  );
}

function ParseResultsFile() {
  var executionResults = [];

  // Grab results file
  var resultsCucumber = JSON.parse(fs.readFileSync(options.file, "utf8"));
  resultsCucumber.forEach((feature, index) => {
    let testCaseId = "1155576";

    feature.elements.forEach((scenario, index) => {
      let stepResults = [];

      // Create the test run log that we will upload later
      var execution = {
        name: scenario.name,
        status: "PASS",
        testCaseId: testCaseId,
      };

      scenario.steps.forEach((step, index) => {
        let stepResult = {
          description: `${step.keyword}${step.name}`,
          expected_result: `step ${index + 1} expected`,
          actual_result: `Execution time: ${step.result.duration / 1000000}ms`,
          status: step.result.status === "passed" ? "pass" : "fail",
          order: index,
        };

        stepResults.push(stepResult);
      });

      execution.testStepLogs = stepResults.slice(0);
      executionResults.push(execution);
    });
  });

  console.log(executionResults);

  return executionResults;
}

async function Login(creds) {
  // NOTE: The documentation says to leave the password empty here so
  //   it's just the email and colon encoded
  const auth = "Basic " + Buffer.from(creds.email + ":").toString("base64");
  const url = "http://" + creds.url + "/oauth/token";
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", creds.email);
  params.append("password", creds.password);

  const payload = {
    method: "post",
    headers: {
      //'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: auth,
    },
    body: params,
  };
  const response = await fetch(url, payload);

  try {
    console.log("Response.ok?: ", response.ok); // Check res.ok for status 200s/300s
    const json = await response.json();
    if (!json.access_token) {
      HandleErrorAndExit("Unable to log in: " + json);
    }

    return json.access_token;
  } catch (error) {
    console.log("Error occurred");
    HandleErrorAndExit("Error logging in: " + error);
  }
}

function HandleErrorAndExit(err) {
  console.log(err);
  process.exit(-1);
}

// Deal with missing requirement command line parameters
// Move to separate file
function HandleOptions(options, cb) {
  if (!options.file) {
    cb("Missing required input file. Try -h for help");
  }
}

async function GetTestCaseForScenario(scenarioName, token) {
  var query = "'Name' = '" + scenarioName + "'"; // Note that this is the name of the Test Case, not Test Run

  // if(options.parentid) {
  // if(options.parenttype = 'test-suite')
  //query = query + " and 'Test Suite' = 'TS-9 Automation Test Suite'"; // Make cmd line driven

  return await apiUtils.Search("test-cases", query, token, creds);
}

async function GetTestRunForScenario(scenarioName, token) {
  var query = "'Name' = '" + scenarioName + "'"; // Note that this is the name of the Test Case, not Test Run

  // if(options.parentid) {
  // if(options.parenttype = 'test-suite')
  //query = query + " and 'Test Suite' = 'TS-9 Automation Test Suite'"; // Make cmd line driven

  return await apiUtils.Search("test-runs", query, token, creds);
}
