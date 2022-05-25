const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const LOGS_TABLE = process.env.LOGS_TABLE;
const options = {};

if(process.env.IS_OFFLINE) {
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

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
