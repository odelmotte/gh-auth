"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
var azPath;
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
var azPSHostEnv = !!process.env.AZUREPS_HOST_ENVIRONMENT ? `${process.env.AZUREPS_HOST_ENVIRONMENT}` : "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var isAzCLISuccess = false;
            let environment = core.getInput("environment").toLowerCase();
            var federatedToken = null;
            // OIDC specific checks
            console.log('Using OIDC authentication...');
            try {
                //generating ID-token
                let audience = core.getInput('audience', { required: false });
                federatedToken = yield core.getIDToken(audience);
                if (!!federatedToken) {
                    let [issuer, subjectClaim] = yield jwtParser(federatedToken);
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
    });
}
function executeAzCliCommand(command, silent, execOptions = {}, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        execOptions.silent = !!silent;
        yield exec.exec(`"${azPath}" ${command}`, args, execOptions);
    });
}
function jwtParser(federatedToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let tokenPayload = federatedToken.split('.')[1];
        let bufferObj = Buffer.from(tokenPayload, "base64");
        let decodedPayload = JSON.parse(bufferObj.toString("utf8"));
        return [decodedPayload['iss'], decodedPayload['sub']];
    });
}
main();
