const fetch = require('node-fetch');

exports.Search = async (objectType, query, token, creds) => {
    console.log(`Query for object type: ${objectType} = `, query);

    const url = "https://" + creds.url + "/api/v3/projects/" + creds.project + "/search";
    const body = {
        object_type: objectType,
        fields: ['*'],
        query: query
    };

    const response = await PostToApi(url, body, token);

    return response.items;
};


exports.CreateTestCaseForScenario = async (scenario, token, creds) => {
    console.log(`Create test case for scenario: ${scenario.name}`, scenario);

    const url = "https://" + creds.url + "/api/v3/projects/" + creds.project + "/test-cases";
    const body = {
        name: scenario.name,
        //parent_id: pass in parent id of parent test suite (via CLI)
        properties: [],
        test_steps: scenario.testStepLogs.map(testStepLog => {
            return {
                description: testStepLog.description,
                expected: testStepLog.expected_result,
                attachments: []
            };
        })
    };

    const response = await PostToApi(url, body, token);

    return response.id;
}

exports.CreateTestRunForScenario = async (scenarioName, testCaseId, token, creds) => {
    console.log(`Create test run for scenario: ${scenarioName}`);

    // TODO: Accept test suite id to create under => e.g. "/test-runs?parentId=133481&parentType=test-suite"
    const url = "https://" + creds.url + "/api/v3/projects/" + creds.project + "/test-runs";
    const body = {
        name: scenarioName,
        test_case: {
            id: testCaseId
        }
    };

    const response = await PostToApi(url, body, token);

    return response.id;
}

const PostToApi = async (url, body, token) => {
    const payload = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + token,
        },
        body: JSON.stringify(body)
    }
    const response = await fetch(url, payload);

    try {
        console.log('Response.ok?: ', response.ok); // Check res.ok for status 200s/300s
        const json = await response.json();

        return json;
    } catch (error) {
        console.log('Error occurred');
        HandleErrorAndExit("Error performing POST to API with values : " + JSON.stringify(body) + "\n\nERROR: " + error);
    }
};

exports.PostToApi = PostToApi;