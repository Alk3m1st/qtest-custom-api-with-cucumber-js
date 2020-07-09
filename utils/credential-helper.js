const fs = require('fs');

exports.CredentialsHelper = (fileName) => {
    let creds = {};

    // We have a creds file
    if(fileName) {
        creds = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }
    else {  // Else grab from environment variables
        creds = {
            "email": process.env.email,
            "password": process.env.password,
            "url": process.env.url,
            "project": process.env.project
        }
    }
    
    return creds;
}