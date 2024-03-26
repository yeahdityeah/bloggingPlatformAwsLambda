'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

module.exports.handler = async (event) => {
    console.log('Received event UPDATE:', event);
    const requestBody = JSON.parse(event.body);
    const postId = event.queryStringParameters.postId; // Assuming postId is passed as a path parameter

    const { title, content } = requestBody;
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

    // DynamoDB update parameters
    const params = {
        TableName: 'BlogPosts',
        Key: {
            postId: postId,
        },
        ExpressionAttributeValues: {
            ':title': title,
            ':content': content,
            ':updatedAt': new Date().toISOString(),
        },
        UpdateExpression: 'SET title = :title, content = :content, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW', // Returns all the attributes of the item after the update
    };

    try {
        const data = await dynamoDb.update(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Blog post updated successfully',
                updatedAttributes: data.Attributes,
            }),
        };
    } catch (error) {
        console.error('Update error', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to update blog post',
                errorMessage: error,
            }),
        };
    }
};
