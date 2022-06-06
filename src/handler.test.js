const aws = require('aws-sdk');
const handler = require('./handler');

jest.mock('aws-sdk', () => {
    const mockedSSM = {
        getParameter: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };
    const mockedConfig = {
        update: jest.fn()
    };
    return {
        SSM: jest.fn(() => mockedSSM),
        config: mockedConfig,
        DynamoDB: {
            DocumentClient: jest.fn(() => ({
                put: () => {
                    return {
                        "promise" : () => {
                            return {}
                        },
                        
                    }
                }
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

    it("should process receive SNS when payload is correct", async () => {
        
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