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

    const dynamodb_table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

   /*  const lambda_backend = new lambda.Function(this, "lambdaFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/lambda"),
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
    }) */

    const lambdaAppDir = path.resolve(__dirname, '../../services/lambda')

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

    dynamodb_table.grantWriteData(lambda_backend.role!)

    const api = new apigateway.RestApi(this, "RestAPI");


    const endpoint = api.root.addResource("scan")
    const endpointMethod = endpoint.addMethod("POST", new apigateway.LambdaIntegration(lambda_backend))

    new cdk.CfnOutput(this, "Endpoint", { value: api.url })

  }
}
