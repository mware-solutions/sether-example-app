const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const Tx = require("ethereumjs-tx");

module.exports = class BlockChainProxy {

    constructor() {
        const provider = new Web3.providers.WebsocketProvider(process.env.RINKEBY_INFURA_HOST);
        this.web3 = new Web3(provider);

        this.address = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

        this.contractInstance = new this.web3.eth.Contract(this.parseABI(),
            process.env.BLOCKCHAIN_CONTRACT_ADDRESS);
        this.account = process.env.BLOCKCHAIN_ACCOUNT;
        this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    }

	// example call to put_sether_address function //
    putSetherAddress(setherAddress) {
        const callData = this.contractInstance.methods["put_sether_address"] (
            setherAddress
        ).encodeABI();

        return this.callContractImpl(callData);
    }

	// example call to another function, besides the business one defined in MyContract.sol //
    callGetFacebookPageImpressions(token, targetID, date, requestID) {
        const callData = this.contractInstance.methods["get_facebook_spec_page_impressions"] (
            this.toBytes32(token),
            "",
            this.toBytes32(date),
            this.toBytes32(targetID),
            1,
            this.toBytes32(requestID)
        ).encodeABI();

        return this.callContractImpl(callData);
    }

	// call to the business API //
    callContract(token, targetID, date, requestID) {
        const callData = this.contractInstance.methods["checkFacebookLikesTarget"] (
                this.toBytes32(token),
                this.toBytes32(date),
                this.toBytes32(targetID),
                1,
                this.toBytes32(requestID)
            ).encodeABI();

        return this.callContractImpl(callData);
    }

	// code to call the blockchain contract //
	// @callData - the encoded abi for the function name and the needed parameters // 	
    callContractImpl(callData) {
        const self = this;
        return new Promise(
            function(resolve, reject) {
                const privateKey = Buffer.from(self.privateKey, "hex");

                self.web3.eth.getTransactionCount(self.account)
                    .then((nonce) => {
                        console.log("Sending raw signedTX with nonce: " + nonce);

                        //creating raw tranaction
                        const rawTransaction = {
                            "from": self.account,
                            "gasPrice": self.web3.utils.toHex(100 * 1e9), // 20 gwei
                            "gasLimit": self.web3.utils.toHex(210000),
                            "to": self.address,
                            "value": "0x0",
                            "data": callData,
                            "nonce": self.web3.utils.toHex(nonce),
                        };

                        //creating tranaction via ethereumjs-tx
                        const signedTX = new Tx(rawTransaction);

                        //signing signedTX with private key
                        signedTX.sign(privateKey);

                        //sending transacton via this.web3 module
                        const transaction = self.web3.eth.sendSignedTransaction('0x' + signedTX.serialize().toString('hex'));

                        transaction.on('transactionHash', hash => {
                            console.log('hash', hash);
                            resolve(hash);
                        });

                        transaction.on('error', error => {
                            console.log('Error occured on the blockchain: ' + error);
                            reject(JSON.stringify(error));
                        });
                    })
                    .catch((error) => {
                        console.log("Error occured on the blockchain: " + error);
                        reject(JSON.stringify(error));
                    });

            });
        }

	// code to wait for events on a contract //
	// @requestId: identfier for the event that we're watching on // 
    waitForEvent(requestId) {
        const self = this;
        return new Promise(
            // wait for the event at moist 10 minutes //
            function(resolve, reject) {
                setTimeout( function() {
                    reject("timeout");
                }, 10 * 60 * 1000);

                self.contractInstance.events.allEvents({fromBlock: 0, toBlock: "latest"})
                    .on('data', (log) => {
                        // preprocess blockchain event //

                        const returnValues = log["returnValues"];
                        if(returnValues && returnValues["targetAchieved"] !== 'undefined' && returnValues["requestID"] !== 'undefined')
                        {
                            const eventRequestID = self.fromBytes32(returnValues["requestID"]);
                            console.log(`received event ${eventRequestID}`);
                            if (eventRequestID== requestId) {
                                console.log(`Received event with the requestID ${requestId}!`);
                                resolve(returnValues["targetAchieved"]);
                            }
                        }
                    })
                    .on('error', (error) => {
                        console.log(`listenEvents error: ${JSON.stringify(error)}`);
                        observer.error(error);
                    });
            });
    }

	// web3js helper functions
    toBytes32(input){
        return this.web3.utils.fromAscii(input);
    }

    fromBytes32(input){
        // Web3.utils pads string with '/0's; we need to remove them and get the util part of the string //
        return this.web3.utils.toAscii(input).split('\0').join("");
    }

    parseABI() {
        try {
            const contractData = JSON.parse(fs.readFileSync('./MyContractABI.json').toString());
            return contractData["abi"];

        } catch (e) {
            console.log(`Failed to get contract data for ${path.basename(contractBinPath)}. Reason: ${e}`);
            return null;
        }

        return null;
    }

    // method nomenclature: //
    // function checkFacebookLikesTarget( bytes32 setherToken, bytes32 date, bytes32 targetId, uint8 level, bytes32 requestID) public //
    buildWeb3CallData(token, targetID, date, requestID) {
        return this.contractInstance.methods["checkFacebookLikesTarget"] (
            this.toBytes32(token),
            this.toBytes32(date),
            this.toBytes32(targetID),
            1,
            this.toBytes32(requestID)
        ).encodeABI();
    }
}