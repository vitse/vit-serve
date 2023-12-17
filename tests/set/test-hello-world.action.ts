import { Request, Response } from 'express';

// https://expressjs.com/fr/guide/routing.html
export const method = 'get';
export const route = '/hello'
const HelloWorldAction = (req: Request, res: Response) => {
    res.send('Hello World!')
}

export default HelloWorldAction;