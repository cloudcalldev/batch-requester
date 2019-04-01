export interface IResponseHandler<P> {
    resolve: (value?: P[] | PromiseLike<P[]> | undefined) => void;
    reject: (reason?: Error) => void;
}