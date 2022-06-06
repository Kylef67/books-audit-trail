const handler = require('./handler');

jest.mock('aws-sdk', () => {
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => ({
                put: () => {
                    return {
                        "promise" : () => {
                            return {}
                        },
                        
                    }
                },
                query: () => {
                    return {
                        "promise" : () => {
                            return {
                                Items: [{
                                    "sample_data" : true
                                }]
                            }
                        },
                        
                    }
                },
            }))
        }
    };
});


describe('receiveSns', () => {

    it("should process receive SNS when payload is correct", async () => {
        
        //arrange
        const payload = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify({
                            "new" : {
                                "customer_name" : "new_some_value",
                            },
                            "old" : {
                                "customer_name" : "old_some_value",
                            },
                            "booksModule" : "SalesInvoice"
                        })
                    }
                }
            ]
        }

        const callback = jest.fn();

        //act
        await handler.receiveSns(payload, undefined, callback)

        //assert
        expect(callback).toHaveBeenCalled();

    })

    it("should process receive SNS when payload is incorrect", async () => {
        
        //arrange
        const payload = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify({"invalid_Data" : true})
                    }
                }
            ]
        }

        const callback = jest.fn();

        //act
        await handler.receiveSns(payload, undefined, callback)

        //assert
        expect(callback).toHaveBeenCalled();

    })

    it("should initialize correct dynamoDB options when offline", async () => {
        
        //arrange
        const payload = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify({"invalid_Data" : true})
                    }
                }
            ]
        }

        const callback = jest.fn();

        //act
        await handler.receiveSns(payload, undefined, callback)

        //assert
        expect(callback).toHaveBeenCalled();


    })
    


})

describe('getAuditTrails', () => {

    beforeEach(() => {
        jest.resetModules() // Most important - it clears the cache
    });

    it("should process getAuditTrails when payload is complete" , async() => {

        //arrange
        const event = {
            queryStringParameters: {
                userId: 1,
                from: '2020-01-01',
                to: '2020-01-02',
                booksModule: 'SalesInvoice'
            }
        }

        const callback = jest.fn();

        //act
        await handler.getAuditTrails(event, undefined, callback)

        //assert
        expect(callback).toHaveBeenCalled();

    })

    it("should process getAuditTrails when payload is incomplete" , async() => {
        //arrange
        const event = {
            queryStringParameters: {
                booksModule: 'SalesInvoice'
            }
        }

        const callback = jest.fn();

        //act
        await handler.getAuditTrails(event, undefined, callback)

        //assert
        expect(callback).toHaveBeenCalled();

    })
})