import { IAutoBatcherResponse } from ".";

export type IMappingCallback<I, P, O> = (originalInput: I[], dataResponse: P[]) => IAutoBatcherResponse<I, O>[];
