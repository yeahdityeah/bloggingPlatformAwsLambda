'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

module.exports.handler = async (event) => {
    console.log('Received event READ:', event);
    const postId = event.queryStringParameters.postId; // Assuming postId is passed as a path parameter
    // const postId = '3b297d7d-a517-4ba4-b735-399fa5271b61';
    const params = {
        TableName: 'BlogPosts',
        Key: {
            postId: postId,
        },
    };
    const token = event?.headers?.Authorization;
    console.log('Received event READ ***** TOKEN:', token);
    if(!token){
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Unauthorized Access', errorMessage: 'Unauthorized Access' }),
        };
    }

    const decodedToken = jwt.decode(token);
    console.log('Received event READ ***** DECODED TOKEN:', decodedToken);
    const userId = decodedToken.email; // Assume userid is the email
    console.log('Received event READ ***** DECODED TOKEN EMAIL:', userId);

    try {
        const data = await dynamoDb.get(params).promise();
        if (!data.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Blog post not found' }),
            };
        }
        if(data.Item.userId !== userId){
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Unauthorized Access', errorMessage: 'Unauthorized Access' }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(data.Item),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to read blog post', errorMessage: error }),
        };
    }
};
