
# Aesi Audit

## Requirements for Local Dev
1. Install JDK
2. Run npm install -g serverless-offline serverless-dynamodb-local serverless-offline-sns
3. npm install within directory

### Deployment

1. update the service name serverless.yml //TODO this can be parameterized but I can't make it work
2. sls deploy -s <your stage>


### Sample implementation in case your service name is `cargill-aesi-audit-trail` and stage is `prod`

#### Save Audits:

```javascript

await snsClient.send(
    new PublishCommand({
        Message: JSON.stringify({
            default: JSON.stringify({
                aesiModule: moduleName, //your module name
                createdAt: parseInt(`${Date.now()}`, 10),
                userId: userId.toString(), //userId of the man
                old: <yourOldData>,
                new: <yourNewData>,
                type: sanitizedOldData ? 'update' : 'create', //or define your own type
                user: sanitizedNewData.user, //username
                transactionId: transactionId.toString(), //id of entity
            }),
        }),
        MessageStructure: 'json',
        TargetArn: AuditSNS,
    })
);

```

#### Fetch Audits:

```javascript

//case you will be fetching yourModule with transaction id of 2839746

getSSMKey('cargill-aesi-audit-trail-prod-api-endpoint').then((ssmUrl) => {
    axios
    .get(`${ssmUrl}/prod/logs?aesiModule=yourModule&transactionId=2839746`)
    .then((response) => {
        const logs = response.data.Items);
    })
    .catch((error) => console.error(error));
});

```



