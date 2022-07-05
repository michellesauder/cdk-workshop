import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface HitCounterProps {
    downstream: lambda.IFunction;

      /**
   * The read capacity units for the table
   *
   * Must be greater than 5 and lower than 20
   *
   * @default 5
   */
  readCapacity?: number;
}

export class HitCounter extends Construct {

    /** allows accessing the counter function */
    public readonly handler: lambda.Function;

    public readonly table: dynamodb.Table

    constructor(scope: Construct, id:string, props: HitCounterProps) {
        super(scope, id)

        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING };
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            readCapacity: props.readCapacity ?? 5
        });

        this.table = table
    
        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hitcounter.handler',
            code: lambda.Code.fromAsset('lamda'),
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: table.tableName
            }
        });

        //grant the lambda role read/write permissions to our table
        table.grantReadWriteData(this.handler)

        // grant the lambda role invoke permissions to the downstream function

        props.downstream.grantInvoke(this.handler)


    }
}