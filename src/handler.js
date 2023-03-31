const AWS = require("aws-sdk");
const jsonDiff = require("json-diff");

const snsOptions = {};
const { LOGS_TABLE } = process.env;
const dynamoDBOptions = { apiVersion: "2012-08-10" };

snsOptions.TopicArn = process.env.AUDIT_SNS_TOPIC;
snsOptions.Endpoint = "https://sns.ap-southeast-1.amazonaws.com";
snsOptions.Protocol = "https";

/* istanbul ignore next */
if (process.env.IS_OFFLINE) {
  snsOptions.Endpoint = "http://localhost:4002";
  snsOptions.Protocol = "http";

  dynamoDBOptions.region = "localhost";
  dynamoDBOptions.endpoint = "http://localhost:8000";
}

const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDBOptions);

/**
 * receiveSns - receives sns trigger
 * @param {Object} event
 * @param {Object} context
 * @param {Object} callback
 */
async function receiveSns(event, context, callback) {
  const data = JSON.parse(event.Records[0].Sns.Message);

  // data.old = sanitizeData(data.old, moduleSettings[data.aesiModule]);
  // data.new = sanitizeData(data.new, moduleSettings[data.aesiModule]);

  if (data.old && data.new) {
    data.diff = jsonDiff.diff(data.old, data.new);
  }

  const params = {
    TableName: LOGS_TABLE,
    Item: data,
  };

  const save = await dynamoDbClient.put(params).promise();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ message: save }),
  });
}

/**
 * getAuditTrails - fetches audit trail data
 * @param {Object} event
 * @param {Object} context
 * @param {Object} callback
 */
async function getAuditTrails(event, context, callback) {
  const { userId, from, to, aesiModule, transactionId } =
    event.queryStringParameters;

  const queryFrom = from
    ? new Date(from).getTime() - 8 * 3600000
    : `${new Date("2022-05-27").getTime()}`;
  const queryTo = to
    ? new Date(to).getTime() - 8 * 3600000
    : `${new Date().getTime()}`;

  const expressions = {
    ":aesiModule": aesiModule,
    ":from": parseFloat(queryFrom), // remove gmt + 8
    ":to": parseFloat(queryTo),
  };

  const keyCondition =
    "aesiModule = :aesiModule and createdAt between :from and :to";

  const params = {
    TableName: LOGS_TABLE,
    ExpressionAttributeValues: expressions,
    KeyConditionExpression: keyCondition,
    ScanIndexForward: false,
  };

  if (userId) {
    expressions[":userId"] = userId;
    params.FilterExpression = "userId = :userId";
  }

  if (transactionId) {
    expressions[":transactionId"] = transactionId;
    params.FilterExpression = "transactionId = :transactionId";
  }

  const result = await dynamoDbClient.query(params).promise();

  callback(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,GET",
    },
    statusCode: 200,
    body: JSON.stringify(result),
  });
}

module.exports = {
  getAuditTrails,
  receiveSns,
};
