import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
export const echoRouter = Router();
const EchoBodySchema = z.object({
    message: z.string().min(1),
});
echoRouter.post('/echo', validateBody(EchoBodySchema), (req, res) => {
    const { message } = req.body;
    res.json({ echo: message });
});
