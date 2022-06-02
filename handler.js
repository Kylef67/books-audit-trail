'use strict';
var AWS = require("aws-sdk");
var jsonDiff = require("json-diff");
const { sanitizeData } = require("./sanitizer");

const snsOptions = {}
const LOGS_TABLE = process.env.LOGS_TABLE;
const dynamoDBOptions = { apiVersion: '2012-08-10' };

snsOptions.TopicArn = process.env.AUDIT_SNS_TOPIC;
snsOptions.Endpoint = 'https://sns.ap-southeast-1.amazonaws.com'
snsOptions.Protocol = 'https'

if (process.env.IS_OFFLINE) {
  snsOptions.Endpoint = 'http://localhost:4002'
  snsOptions.Protocol = 'http'

  dynamoDBOptions.region = 'localhost';
  dynamoDBOptions.endpoint = 'http://localhost:8000'

}

const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDBOptions)

const sns = new AWS.SNS({
  endpoint: snsOptions.Endpoint,
  region: "ap-southeast-1",
});

function sendSns(event, context, callback) {
  console.log(snsOptions.TopicArn)
  console.log(process.env.IS_OFFLINE)

  const payload = {
    booksModule: "App/SalesInvoice",
    createdAt: 1641081600000,
    userId: "1"
  }

  const message = {
    "default": JSON.stringify(payload)
  }

  sns.publish({
    Message: JSON.stringify(message),
    MessageStructure: "json",
    TopicArn: snsOptions.TopicArn,
  }, () => {
    callback(null, {
      'statusCode': 400,
      'body': JSON.stringify({ 'message': 'No request body' })
    });
  });
}

async function receiveSns(event, context, callback) {
  const data = JSON.parse(event.Records[0].Sns.Message)

  data.old = sanitizeData(data.old, data.booksModule);
  data.new = sanitizeData(data.new, data.booksModule);

  if (data.old && data.new) {
    data.diff = jsonDiff.diff(data.old, data.new)
  }

  console.log(JSON.stringify(data));

  const params = {
    TableName: LOGS_TABLE,
    Item: data,
  };

  const save = await dynamoDbClient.put(params).promise();

  callback(null, {
    'statusCode': 400,
    'body': JSON.stringify({ 'message': save })
  });
}

async function getAuditTrails(event, context, callback) {
  const { userId, from, to, booksModule } = event.queryStringParameters

  const queryFrom = (from) ? new Date(from).getTime() : new Date('2022-05-27').getTime()
  const queryTo = (to) ? new Date(to).getTime() : new Date().getTime()

  const expressions = {
    ':booksModule': booksModule,
    ':from': parseFloat(queryFrom),
    ':to': parseFloat(queryTo),
  };

  let keyCondition = "booksModule = :booksModule and createdAt between :from and :to";

  const params = {
    TableName: LOGS_TABLE,
    ExpressionAttributeValues: expressions,
    KeyConditionExpression: keyCondition
  };

  if (userId) {
    expressions[":userId"] = userId
    params.FilterExpression = "userId = :userId"
  }

  try {
    const { Items } = await dynamoDbClient.query(params).promise();

    console.log(Items)
    if (Items) {

      callback(null, {
        'statusCode': 400,
        'body': JSON.stringify({ 'message': Items })
      });

    } else {

    }
  } catch (error) {
    console.log(error);

  }
}

module.exports = {
  sendSns,
  getAuditTrails,
  receiveSns

}