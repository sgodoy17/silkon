import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  LambdaFunctionURLEvent,
  LambdaFunctionURLResult,
  SQSBatchResponse,
  SQSEvent,
} from 'aws-lambda';

export interface HandlerPort {
  execute<T = APIGatewayProxyResult | LambdaFunctionURLResult | SQSBatchResponse>(
    requestId: string,
    event: APIGatewayProxyEvent | LambdaFunctionURLEvent | SQSEvent,
  ): Promise<T>;
}
