// const AWS = require("aws-sdk");
// AWS.config.update({region: 'ap-southeast-1'});
// const express = require("express");
// const serverless = require("serverless-http");

// const app = express();

// const LOGS_TABLE = process.env.LOGS_TABLE;
// const dynamoDBOptions = {};
// const snsOptions = {};

// snsOptions.TopicArn = process.env.AUDIT_SNS_TOPIC;
// snsOptions.Endpoint = 'https://sns.ap-southeast-1.amazonaws.com'
// snsOptions.Protocol = 'https'

// if (process.env.IS_OFFLINE) {
//   dynamoDBOptions.region = 'localhost';
//   dynamoDBOptions.endpoint = 'http://localhost:8000'

//   snsOptions.Endpoint = 'http://localhost:4002'
//   snsOptions.TopicArn = 'arn:aws:sns:ap-southeast-1:123456789012:books-audit-trail-dev'
//   snsOptions.Protocol = 'http'
// }



// const sns =  new AWS.SNS({apiVersion: '2010-03-31'});

// const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDBOptions)

// app.use(express.json());

// app.get("/log/:userId", async function (req, res) {
//   const params = {
//     TableName: LOGS_TABLE,
//     Key: {
//       userId: req.params.userId,
//     },
//   };

//   try {
//     const { Item } = await dynamoDbClient.get(params).promise();
//     if (Item) {
//       const { userId } = Item;
//       res.json({ userId });
//     } else {
//       res
//         .status(404)
//         .json({ error: 'Could not find user with provided "userId"' });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Could not retreive user" });
//   }
// });

// app.post("/log", async function (req, res) {
//   const { userId } = req.body;
//   if (typeof userId !== "string") {
//     res.status(400).json({ error: '"userId" must be a string' });
//   }

//   const params = {
//     TableName: LOGS_TABLE,
//     Item: {
//       userId: userId
//     },
//   };

//   try {
//     await dynamoDbClient.put(params).promise();
//     res.json({ userId });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Could not create user" });
//   }
// });

// app.get('/', (req, res) => {

//   //console.log('sns received')
//   //console.log(JSON.stringify(req.body))

//   sns.subscribe(snsOptions, function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(data);
//       console.log("pong")
//       console.log(JSON.stringify(req.body))
//     }

//     res.end();
//   });

// });

// app.get('/send', (req, res) => {

//   sns.publish({
//     Message: '{"default": "powta!"}',
//     MessageStructure: "json",
//     TopicArn: snsOptions.TopicArn
//   }, (err, data) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(data);
//       console.log("ping")
//     }

//     res.end();

//   })


// });

// app.use((req, res, next) => {
//   return res.status(404).json({
//     error: "Not Found",
//   });
// });




// module.exports.handler = serverless(app);

'use strict';
var AWS = require("aws-sdk");

const snsOptions = {}
const LOGS_TABLE = process.env.LOGS_TABLE;
const dynamoDBOptions = { apiVersion: '2012-08-10' };

snsOptions.TopicArn = process.env.AUDIT_SNS_TOPIC;
snsOptions.Endpoint = 'https://sns.ap-southeast-1.amazonaws.com'
snsOptions.Protocol = 'https'

if (process.env.IS_OFFLINE) {
  snsOptions.Endpoint = 'http://localhost:4002'
  snsOptions.Protocol = 'http'

}

if (process.env.IS_OFFLINE) {
  dynamoDBOptions.region = 'localhost';
  dynamoDBOptions.endpoint = 'http://localhost:8000'
}

console.log(process.env.AUDIT_SNS_TOPIC)

const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDBOptions)

module.exports.sendSns = (event, context, callback) => {

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

  console.log(JSON.stringify({
    "default": JSON.stringify(payload)
  }))

  var sns = new AWS.SNS({
    endpoint: snsOptions.Endpoint,
    region: "ap-southeast-1",
  });

  sns.publish({
    Message: JSON.stringify(message),
    MessageStructure: "json",
    TopicArn: snsOptions.TopicArn,
  }, () => {
    console.log("ping");
    callback(null, {
      'statusCode': 400,
      'body': JSON.stringify({ 'message': 'No request body' })
    });
  });

};

module.exports.receiveSns = async (event, context, callback) => {
  console.log("pong start");
  console.log(JSON.stringify(event));
  console.log(event.Records[0].Sns.Message);

  const data = JSON.parse(event.Records[0].Sns.Message)

  const params = {
    TableName: LOGS_TABLE,
    Item: data,
  };

  try {
    await dynamoDbClient.put(params).promise();
  } catch (error) {
    console.log(error);
  }

  callback(null, {
    'statusCode': 400,
    'body': JSON.stringify({ 'message': event.Records[0].Sns })
  });
};

module.exports.getAuditTrails = async (event, context, callback) => {

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

  if(userId) {
    expressions[":userId"] = userId
    //keyCondition += " and userId = :userId"
    params.FilterExpression = "userId = :userId"
  }

  console.log(params);

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