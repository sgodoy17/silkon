import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  LambdaFunctionURLEvent,
  LambdaFunctionURLResult,
  SQSBatchResponse,
  SQSEvent,
} from 'aws-lambda';

export interface HandlerPort {
  execute(
    requestId: string,
    event: APIGatewayProxyEvent | LambdaFunctionURLEvent | SQSEvent,
  ): Promise<APIGatewayProxyResult | LambdaFunctionURLResult | SQSBatchResponse>;
}
