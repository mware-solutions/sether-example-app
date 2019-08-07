# sether-example-app
Client-Server (Angular-NodeJS) application for demonstrating SETHER API usage. This can also be used as a template for future Social Marketing dapps.

Artifacts: 
 - example-app-server: nodejs server, that listens on port 5000
	- REST API:
		- callContract. Parameters: 
			- token: string - setherToken obtained from the Sether dashboard
			- targetID: string - the targetID associated with your campaign
			- date: string - ISO string for the needed KPI timestamp 
			- requestID: string - unique identfier of the call
		- getEvent:
			- requestID: string - unique identfier of the expected event
	- To run, just fire up node server.js in the console.
	
 - example-app-client: Angular 7 app, that connects to the example-app-server