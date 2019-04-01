export type IDataFunction<I, P> = (input: I[]) => Promise<P[]> | P[];
