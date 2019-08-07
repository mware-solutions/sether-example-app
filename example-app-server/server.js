const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const BlockchainProxy = require("./BlockChainProxy.js");

require('dotenv').config();

var expressApp = express();
var blockchainProxy;

function initializeServer() {
    expressApp.use(cors());
    expressApp.use(bodyParser.urlencoded({extended: false}));
    expressApp.use(bodyParser.json());
    expressApp.use(function (req, res, next) {
        res.header("Access-Control-Allow-Headers", "*");
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Methods", "POST");
        next();
    });
}

function processRequest(request, response) {
    const requestBody = request.body;
    console.log(`Processing request from client: ${JSON.stringify(request.body)}`);

    try {
        if (requestBody.type == "callContract") {
            // validate parameters //
            if (!requestBody['token'] || !requestBody.targetID || !requestBody.date || !requestBody.requestID)
                console.log('here');
            //response.send({error: "Invalid parameters. Expected token, targetID, date and requestID"})
            else {
                console.log(`Waiting for event with requestID: ${requestBody.requestID}`);

                blockchainProxy.callContract(requestBody.token, requestBody.targetID,
                    requestBody.date, requestBody.requestID)
                    .then(result => {
                        console.log(`Blockchain call result: ${JSON.stringify(result)}`);
                        response.send({
                            transactionHash: result
                        })
                    })
                    .catch(error => {
                        console.log(`Error occured while calling the contract: ${error}`);
                        response.send({
                            error: `Blockchain error: ${error}`
                        })
                    });
            }
        }
        else if (requestBody.type == "getEvent") {
            // validate parameters //

            if (!requestBody.requestID)
                response.send({error: "Invalid parameters. Expected requestID"})
            else {
                console.log(`Waiting for event with requestID: ${requestBody.requestID}`);

                blockchainProxy.waitForEvent(requestBody.requestID)
                    .then(result => {
                        console.log(`Blockchain event received: ${JSON.stringify(result)}`);
                        response.send({targetAchieved: result})
                    })
                    .catch(error => {
                        console.log(`Error occured while calling the contract: ${error}`);
                        response.send({
                            error: `Event listen error: ${error}`
                        })
                    });
            }
        }
        else {
            response.send({error: `Unsupported API: ${requestBody.type}`});
        }
    } catch (e) {
        console.log(`Error ${e} occured while processing request ${requestBody['type']}`);
    }

}

function startServer() {
    expressApp.post("/", (req, res) => processRequest(req, res));

    expressApp.listen(process.env.SETHERAPI_PORT, () =>
        console.log(`Sether server listening on ${process.env.SETHERAPI_PORT} !`));
}

function main() {
    try {
        console.log(`Starting SetherAPI example server app`);

        blockchainProxy = new BlockchainProxy();

        // initialize the server //
        initializeServer();

        // process requests //
        startServer();

    } catch (e) {
        console.log(`SetherAPI example server app FAILED with ${e}`);
    } finally {
        console.log(`Started SetherAPI example server!`);
    }

}

main();