import type { Response } from 'express';
export function sendJSON(res: Response, data: string){
    res.header('Content-Type', 'application/json').send(data);
}