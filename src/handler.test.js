const aws = require('aws-sdk');
const { receiveSns } = require('./handler');

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

    it("should work", async () => {
        
        //arrange
        const payload = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify({
                            "new" : {
                                "some_key" : "new_some_value",
                            },
                            "old" : {
                                "some_key" : "old_some_value",
                            }
                        })
                    }
                }
            ]
        }

        const callback = jest.fn();

        //act
        const result = await receiveSns(payload, undefined, callback)

        //assert
        console.log(result);

    })


})