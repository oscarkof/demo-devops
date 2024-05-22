import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy, aws_lambda_nodejs, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from "path";


export class DemoInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table with partition key = id
    const dynamodb_table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    //define lambda source location in services folder
    const lambdaAppDir = path.resolve(__dirname, '../../services/lambda')

    //create lambda function with nodejs runtime using services folder as project root.
    const lambda_backend = new aws_lambda_nodejs.NodejsFunction(this, 'lambdaFunction',
      {
        functionName: 'lambdaFunction',
        entry: path.join(lambdaAppDir, 'index.ts'),
        handler: 'index.handler',
        depsLockFilePath: path.join(lambdaAppDir, 'package-lock.json'),
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          DYNAMODB: dynamodb_table.tableName
        }
      });

    //grant write permission in dynamodDB to lambda
    dynamodb_table.grantWriteData(lambda_backend.role!)

    //create rest api endpoint 
    const api = new apigateway.RestApi(this, "RestAPI");

    //define endpoint and method POST integrate with lamdba 
    const endpoint = api.root.addResource("scan")
    const endpointMethod = endpoint.addMethod("POST", new apigateway.LambdaIntegration(lambda_backend))

    //output api endpoint url.
    new cdk.CfnOutput(this, "Endpoint", { value: api.url })

  }
}
