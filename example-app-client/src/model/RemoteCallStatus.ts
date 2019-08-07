export class RemoteCallStatus {
  private running = false;
  private finished = false;
  private result: any = {};
  private error = '';

  get InProgress(): boolean {
    return this.running;
  }

  get Finished(): boolean {
    return this.finished;
  }

  get Succeeded() {
    return this.finished && this.error.length === 0;
  }

  get Failed() {
    return this.finished && this.error.length !== 0;
  }

  get Error(): string {
    return this.error;
  }

  get Result(): any {
    return this.result;
  }

  onCallStarted() {
    this.running = true;
    this.finished = false;
  }

  onCallSucceeded(result): void {
    this.running = false;
    this.finished = true;
    this.result = result;
  }

  onCallFailed(error: string): void {
    this.running = false;
    this.finished = true;
    this.error = error;
  }
}
