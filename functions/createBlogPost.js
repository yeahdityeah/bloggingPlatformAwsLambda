'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

module.exports.handler = async (event) => {
    console.log('Received event:', event);
    const requestBody = JSON.parse(event.body);
    // const requestBody = {'title' : 'hello', 'content' : 'hello', 'userId' : 'hello'}
    //command to get new auth token ----> aws cognito-idp admin-initiate-auth --user-pool-id us-east-1_VqzCDJv8t --client-id 6rrobqvsmr2d6t4juhcpmgnkfh  --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=nits.dahiya@gmail.com,PASSWORD=Test@123
    const token = event?.headers?.Authorization;
    if(!token){
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Unauthorized Access', errorMessage: 'Unauthorized Access' }),
        };
    }

    const decodedToken = jwt.decode(token);
    const userId = decodedToken.email; // Assume userid is the email
    const title = requestBody.title;
    const content = requestBody.content;


    const params = {
        TableName: 'BlogPosts',
        Item: {
            postId: uuid.v4(),
            title: title,
            content: content,
            userId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
    };

    try {
        await dynamoDb.put(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Blog post created successfully', postId: params.Item.postId }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to create blog post', errorMessage: error }),
        };
    }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
