export class Logger {
    constructor() {
        console.log('Logger initialized!');
    }

    request(requestData, requestId) {
        if (typeof requestData === 'string') {
            this.info('logger.js', 'request', requestId, requestData);
        } else {
            this.info('logger.js', 'request', requestId, JSON.stringify(requestData));
        }
    }

    response(responseData, requestId) {
        if (responseData.statusCode / 100 !== 2) {
            if (typeof responseData === 'string') {
                this.error('logger.js', 'response', requestId, responseData);
            } else {
                this.error('logger.js', 'response', requestId, JSON.stringify(responseData));
            }
        } else {
            if (typeof responseData === 'string') {
                this.info('logger.js', 'response', requestId, responseData);
            } else {
                this.info('logger.js', 'response', requestId, JSON.stringify(responseData));
            }
        }
    }

    info(fileName, methodName, requestId, data = {}) {
        console.log('Info Log: ', JSON.stringify({
            fileName,
            methodName,
            requestId,
            data,
            level: 'info'
        }))
    }

    error(fileName, methodName, requestId, data = {}) {
        console.error('Error Log: ', JSON.stringify({
            fileName,
            methodName,
            requestId,
            data,
            level: 'error'
        }))
    }

    debug(fileName, methodName, requestId, data = {}) {
        console.debug('Debug Log: ', JSON.stringify({
            fileName,
            methodName,
            requestId,
            data,
            level: 'debug'
        }))
    }

    warn(fileName, methodName, requestId, data = {}) {
        console.warn('Warning Log: ', JSON.stringify({
            fileName,
            methodName,
            requestId,
            data,
            level: 'warn'
        }))
    }
}

export const logger = new Logger();