export class BatchTimeout {

    private _timeout: any;

    constructor(
        private _timeoutValue: number = 250,
        private _functionToRun: any,
    ) {}

    private _setTimeout() {
        this._timeout = setTimeout(this._functionToRun, this._timeoutValue);
    }

    public clearAndStartTimer() {

        clearTimeout(this._timeout);

        this._setTimeout();

    }

}
