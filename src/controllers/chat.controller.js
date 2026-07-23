const { chatService } = require('../services/chat.service');
const { successResponse } = require('../utils/responseHelper');

const users = async (req, res) => successResponse(res, { data: { users: await chatService.users(req.user) } });
const messages = async (req, res) => successResponse(res, { data: { messages: await chatService.messages(req.user, req.params.peerId) } });
const send = async (req, res) => successResponse(res, { statusCode: 201, data: { message: await chatService.send(req.user, req.body) } });
const unread = async (req, res) => successResponse(res, { data: { messages: await chatService.unread(req.user) } });

module.exports = { users, messages, send, unread };
