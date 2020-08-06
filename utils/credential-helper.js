const fs = require("fs");
const fetch = require("node-fetch");

exports.LoadCredentials = (fileName) => {
  let creds = {};

  // We have a creds file
  if (fileName) {
    creds = JSON.parse(fs.readFileSync(fileName, "utf8"));
  } else {
    // Else grab from environment variables
    creds = {
      email: process.env.email,
      password: process.env.password,
      url: process.env.url,
      project: process.env.project,
    };
  }

  return creds;
};

exports.Login = async (creds) => {
  // NOTE: The documentation says to leave the password empty here so
  //   it's just the email and colon encoded
  const auth = "Basic " + Buffer.from(creds.email + ":").toString("base64");
  const url = "https://" + creds.url + "/oauth/token";
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
};
