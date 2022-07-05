import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { HitCounter, HitCounterProps } from './hitcounter';
import { TableViewer } from 'cdk-dynamo-table-viewer';


import { addLambdaPermission, ApiGateway } from 'aws-cdk-lib/aws-events-targets';
import * as cdk from 'aws-cdk-lib';
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: HitCounterProps) {

    if(props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)){
      throw  new Error('readCapacity must be greater than 5 and less than 20')
    }

    super(scope, id, props);

    // defines an AWS Lambda resource
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
      code: lambda.Code.fromAsset('lamda'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler
    })

    new TableViewer(this, 'ViewHitCounter', {
      title: 'Hello Hits',
      table: helloWithCounter.table,
      sortBy: '-hits'
    })

  }
}
