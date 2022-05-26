	
var AWS = require("aws-sdk"); // must be npm installed to use
var sns = new AWS.SNS({
  endpoint: "http://127.0.0.1:4002",
  region: "ap-southeast-1",
});
sns.publish({
  Message: "{content: \"hello!\"}",
  MessageStructure: "json",
  TopicArn: process.env.AUDIT_SNS_TOPIC,
}, () => {
    console.log(process.env.AUDIT_SNS_TOPIC)
  console.log("ping");
});