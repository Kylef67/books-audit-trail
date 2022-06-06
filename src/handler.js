'use strict';
let AWS = require("aws-sdk");
let jsonDiff = require("json-diff");
const { sanitizeData } = require("./sanitizer");

const snsOptions = {}
const LOGS_TABLE = process.env.LOGS_TABLE;
const dynamoDBOptions = { apiVersion: '2012-08-10' };
const moduleSettings = require("./auditSettings.json");

snsOptions.TopicArn = process.env.AUDIT_SNS_TOPIC;
snsOptions.Endpoint = 'https://sns.ap-southeast-1.amazonaws.com'
snsOptions.Protocol = 'https'

/* istanbul ignore next */
if (process.env.IS_OFFLINE) {
    snsOptions.Endpoint = 'http://localhost:4002'
    snsOptions.Protocol = 'http'

    dynamoDBOptions.region = 'localhost';
    dynamoDBOptions.endpoint = 'http://localhost:8000'

}

const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDBOptions)

/**
 * receiveSns - receives sns trigger 
 * @param {Object} event
 * @param {Object} context
 * @param {Object} callback
 */
async function receiveSns(event, context, callback) {

    const data = JSON.parse(event.Records[0].Sns.Message)

    data.old = sanitizeData(data.old, moduleSettings[data.booksModule]);
    data.new = sanitizeData(data.new, moduleSettings[data.booksModule]);

    if (data.old && data.new) {
        data.diff = jsonDiff.diff(data.old, data.new)
    }

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

/**
 * getAuditTrails - fetches audit trail data
 * @param {Object} event
 * @param {Object} context
 * @param {Object} callback
 */
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

    const { Items } = await dynamoDbClient.query(params).promise();

    callback(null, {
        'statusCode': 400,
        'body': JSON.stringify({ 'message': Items })
    });

}

module.exports = {
    getAuditTrails,
    receiveSns
}