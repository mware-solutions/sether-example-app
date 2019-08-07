import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {RemoteCallStatus} from '../model/RemoteCallStatus';
import {UUID} from 'angular2-uuid';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = '';
  date = new Date();
  public setherToken: string = "OUEXQOHZLXIMSYKA";
  public targetID: string = "532486337109620";
  private server: string;
  public methodCallStatus: RemoteCallStatus = new RemoteCallStatus();
  public eventStatus: RemoteCallStatus = new RemoteCallStatus();
  constructor(private http: HttpClient) {
    this.server = environment.url;
  }

  onRunContract() {
    this.methodCallStatus = new RemoteCallStatus();
    this.eventStatus = new RemoteCallStatus();
    const self = this;

    // first, generate an unique GUID for the call //
    let requestID = UUID.UUID().toString();
    // remove '-' characters to have a correct bytes32 value //
    requestID = requestID.split('-').join('');

    this.callServer(
      {
                  type: 'callContract',
                  token: this.setherToken,
                  targetID: this.targetID,
                  date: new Date().toISOString(),
                  requestID: requestID
      }, this.methodCallStatus)
      .then( () => {
        self.callServer({type: "getEvent", requestID: requestID}, self.eventStatus)
          .then(
            () => console.log('Received event from blockchain!')
          );
      });
    }

  private callServer(parameters: any, status: RemoteCallStatus): Promise<any> {
    status.onCallStarted();

    const self = this;
    return new Promise<any>(function(resolve, reject) {
      // make call to the example server //
      self.http.post(self.server, parameters).
      subscribe(
        (response) => {
          if (response['error']) {
            status.onCallFailed(response['error']);
          }
          else {
            status.onCallSucceeded(response);
            resolve();
          }
        },
        error => {
          console.log(`Error in calling the example server. Response: ${JSON.stringify(error)}`);
          status.onCallFailed(error);
        });
    });
  }
}
