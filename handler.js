const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const LOGS_TABLE = process.env.LOGS_TABLE;
const options = {};

let sns = new AWS.SNS();

if (process.env.IS_OFFLINE) {
  options.region = 'localhost';
  options.endpoint = 'http://localhost:8000'
}

const dynamoDbClient = new AWS.DynamoDB.DocumentClient(options)

app.use(express.json());

app.get("/log/:userId", async function (req, res) {
  const params = {
    TableName: LOGS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId } = Item;
      res.json({ userId });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.post("/log", async function (req, res) {
  const { userId } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  }

  const params = {
    TableName: LOGS_TABLE,
    Item: {
      userId: userId
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.get('/', (req, res) => {

  console.log(process.env.AUDIT_SNS_TOPIC)

  var params = {
    Protocol: 'http', /* required */   //http , https ,application
    TopicArn: 'arn:aws:sns:ap-southeast-1:123456789012:books-audit-trail-dev',
    Endpoint: 'http://127.0.0.1:4002'
  };

  sns.subscribe(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      console.log("pong")
    }
  });
  res.end();
});

app.get('/send', (req, res) => {

  console.log(process.env.AUDIT_SNS_TOPIC)

  var sns = new AWS.SNS({
    endpoint: "http://127.0.0.1:4002",
    region: "ap-southeast-1",
  });
  
  sns.publish({
    Message: '{"default": "powta!"}',
    MessageStructure: "json",
    TopicArn: 'arn:aws:sns:ap-southeast-1:123456789012:books-audit-trail-dev',
  }, () => {
    console.log("ping");
    
  });

  res.end();
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});




module.exports.handler = serverless(app);

// 'use strict';
// var AWS = require("aws-sdk");

// module.exports.ping = (event, context, callback) => {
  
//   console.log(process.env.AUDIT_SNS_TOPIC)
  
//   var sns = new AWS.SNS({
//     endpoint: "http://localhost:4002",
//     region: "ap-southeast-1",
//   });
//   sns.publish({
//     Message: '{"default": "hello!"}',
//     MessageStructure: "json",
//     TopicArn: process.env.AUDIT_SNS_TOPIC,
//   }, () => {
//     console.log("ping");
//     callback(null, {response: "return from lambda ping"});
//   });
// };

// module.exports.pong = (event, context, callback) => {
//   console.log("pong start");
//   console.log(JSON.stringify(event));
//   // console.log(event.Records[0].Sns.Message);
//   callback(null, {response: "return from lambda pong"});
// };