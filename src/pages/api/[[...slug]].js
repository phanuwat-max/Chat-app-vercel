import app from '../../../backend/server.js';

export const config = {
    api: {
        bodyParser: false, // Disable Next.js body parser to let Express handle it
        externalResolver: true, // Tell Next.js this is handled externally
    },
};

export default function handler(req, res) {
    return new Promise((resolve, reject) => {
        // Express app handles the request
        app(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}
