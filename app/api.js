import { Router } from 'express';
import { Validator } from 'jsonschema';
import AppState from './app-state-schema';
import AWS from 'aws-sdk';
import md5 from 'md5';
import request from 'request';
import { isUri } from 'valid-url';

const validator = new Validator();
const { AWS_ACCESS_KEY, AWS_SECRET_KEY, NODE_ENV } = process.env;
const s3 = new AWS.S3();
const router = new Router();

if (NODE_ENV === 'production' && (!AWS_ACCESS_KEY || !AWS_SECRET_KEY)) {
    throw Error('AWS_SECRET_KEY, AWS_SECRET_KEY are not set');
}

AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
});

router.post('/save', ({ jsonBody, rawBody }, res) => {
    const { errors } = validator.validate(jsonBody, AppState);
    if (errors.length) {
        res.json(400, {
            error: errors.join('; ')
        });
    } else {
        const key = md5(rawBody);
        const params = {
            Bucket: 'jsonlintcom',
            Key: `${key}.json`,
            Body: rawBody,
            ContentType: 'application/json'
        };

        s3.putObject(params, (error) => {
            if (error) {
                const { code, message } = error;
                res.json(400, {
                    error: `${code}: ${message}`
                });
            } else {
                res.json({ key, error: null });
            }
        });
    }
});

router.post('/proxy', (req, res) => {
    const url = String(req.jsonBody.url).trim();

    if (isUri(url)) {
        request(url, (error, response, body) => {
            if (error) {
                res.json(400, { error: `Error ${error.code || 'unknown'}` });
            } else if (response.statusCode === 200) {
                res.json({ body, error: null });
            } else {
                res.json({ error: `Error ${response.statusCode}` });
            }
        });
    } else {
        res.json(400, { error: 'Wrong URL format' });
    }
});

export default router;