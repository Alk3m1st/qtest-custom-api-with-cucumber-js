const fs = require("fs");

exports.ParseResultsFile = (file) => {
  var executionResults = [];

  // Grab results file
  var resultsCucumber = JSON.parse(fs.readFileSync(file, "utf8"));
  resultsCucumber.forEach((feature, index) => {
    feature.elements.forEach((scenario, index) => {
      let stepResults = [];

      // Create the test run log that we will upload later
      var execution = {
        name: scenario.name,
        status: "PASS",
        testCaseId: 0,
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
};
