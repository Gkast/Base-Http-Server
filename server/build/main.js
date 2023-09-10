"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const graceful_shutdown_1 = require("./util/tools/graceful-shutdown");
const logger_1 = require("./util/tools/logger");
const connection_config_1 = require("./util/config/connection-config");
const router_config_1 = require("./util/config/router-config");
const request_handler_1 = require("./handler/request-handler");
const error_handler_1 = require("./handler/error-handler");
const http_1 = require("http");
exports.logger = (0, logger_1.createLogger)(process.env.LOG_LEVEL || 'info');
exports.logger.info(`Process initiated with id: ${process.pid}`);
process.on('unhandledRejection', (reason, promise) => (0, error_handler_1.handleUnhandledRejection)(reason, promise));
process.on('uncaughtException', (err) => (0, error_handler_1.handleUncaughtException)(err));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const smtpTransport = yield (0, connection_config_1.createSMTPTransport)();
        const dbPool = yield (0, connection_config_1.createDatabasePool)();
        const captchaSecret = process.env.CAPTCHA_SECRET;
        const router = yield (0, router_config_1.createRouter)(dbPool, smtpTransport, captchaSecret);
        let ongoingRequests = 0;
        const server = (0, http_1.createServer)((nodeReq, nodeRes) => {
            ongoingRequests++;
            (0, request_handler_1.handleRequest)(nodeReq, nodeRes, router, dbPool);
            nodeRes.on('finish', () => ongoingRequests--);
        });
        server.keepAliveTimeout = 30000;
        server.on('error', (err) => (0, error_handler_1.handleServerError)(err, PORT));
        server.on('clientError', (err, socket) => (0, error_handler_1.handleClientError)(err, socket));
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            exports.logger.info(`Server initialized and listening on port ${PORT}`);
            const timeoutMs = 10000;
            (0, graceful_shutdown_1.initiateGracefulShutdown)(server, dbPool, smtpTransport, timeoutMs, { getOngoingRequests: () => ongoingRequests });
        });
    });
}
startServer().catch(reason => (0, error_handler_1.handleStartServerError)(reason));
