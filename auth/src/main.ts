import * as core from '@actions/core';
import * as exec from '@actions/exec';

var azPath: string;
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
var azPSHostEnv = !!process.env.AZUREPS_HOST_ENVIRONMENT ? `${process.env.AZUREPS_HOST_ENVIRONMENT}` : "";

async function main() {
    try {
        var isAzCLISuccess = false;
        let environment = core.getInput("environment").toLowerCase();
        var federatedToken = null;


        // OIDC specific checks
        console.log('Using OIDC authentication...')
        try {
            //generating ID-token
            let audience = core.getInput('audience', { required: false });
            federatedToken = await core.getIDToken(audience);
            if (!!federatedToken) {
                let [issuer, subjectClaim] = await jwtParser(federatedToken);
                console.log("Federated token details: \n issuer - " + issuer + " \n subject claim - " + subjectClaim);
                core.setOutput('federatedToken', federatedToken);
                core.setOutput('issuer', issuer);
                core.setOutput('subjectClaim', subjectClaim);
            }
        }
        catch (error) {
            core.error(error.message);
            core.error(`${error.message.split(':')[1]}. Please make sure to give write permissions to id-token in the workflow.`);
        }

        console.log("Login successful.");
    }
    catch (error) {
        if (!isAzCLISuccess) {
            core.setFailed("Az CLI Login failed. Please check the credentials and make sure az is installed on the runner. For more information refer https://aka.ms/create-secrets-for-GitHub-workflows");
        }
        else {
            core.setFailed(`Azure PowerShell Login failed. Please check the credentials and make sure az is installed on the runner. For more information refer https://aka.ms/create-secrets-for-GitHub-workflows"`);
        }
    }
    finally {
        // Reset AZURE_HTTP_USER_AGENT
    }
}

async function executeAzCliCommand(
    command: string,
    silent?: boolean,
    execOptions: any = {},
    args: any = []) {
    execOptions.silent = !!silent;
    await exec.exec(`"${azPath}" ${command}`, args, execOptions);
}
async function jwtParser(federatedToken: string) {
    let tokenPayload = federatedToken.split('.')[1];
    let bufferObj = Buffer.from(tokenPayload, "base64");
    let decodedPayload = JSON.parse(bufferObj.toString("utf8"));
    return [decodedPayload['iss'], decodedPayload['sub']];
}
main();
