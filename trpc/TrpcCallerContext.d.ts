// keep it separate to not be imported in a file with secrets

export type TrpcCallerContext = { req: Request };
export type WithTrpcCallerContext = { trpcCallerContext: TrpcCallerContext };
