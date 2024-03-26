'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

module.exports.handler = async (event) => {
    console.log('Received event DELETE:', event);
    const postId = event.queryStringParameters.postId; // Assuming postId is passed as a path parameter


    //*****AUTH******************** */
    const token = event?.headers?.Authorization;
    if(!token){
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Unauthorized Access', errorMessage: 'Unauthorized Access' }),
        };
    }

    const decodedToken = jwt.decode(token);
    const userId = decodedToken.email;
    try {
        const data = await dynamoDb.get({
            TableName: 'BlogPosts',
            Key: {
                postId: postId,
            },
        }).promise();
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
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to read blog post', errorMessage: error }),
        };
    }

    const params = {
        TableName: 'BlogPosts',
        Key: {
            postId: postId,
        },
        ReturnValues: 'ALL_OLD', // This returns the item content that was deleted
    };

    try {
        const data = await dynamoDb.delete(params).promise();
        if (data.Attributes) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Blog post deleted successfully',
                    deletedPost: data.Attributes,
                }),
            };
        } else {
            // If no attributes are returned, the item did not exist
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Blog post not found' }),
            };
        }
    } catch (error) {
        console.error('Delete error', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to delete blog post',
                errorMessage: error,
            }),
        };
    }
};
