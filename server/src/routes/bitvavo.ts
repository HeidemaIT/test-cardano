import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate';

export const bitvavoRouter = Router();

const AddressParamsSchema = z.object({
  addr: z.string().min(10),
});

bitvavoRouter.get('/bitvavo/:addr/assets', validateParams(AddressParamsSchema), async (req, res) => {
  const { addr } = req.params as { addr: string };
  const raw = req.query.raw === '1' || req.query.raw === 'true';

  // Debug logging
  console.log('Bitvavo route called for address:', addr);

  // Bitvavo provider is not implemented yet
  return res.status(501).json({ 
    error: 'Bitvavo provider not implemented',
    suggestion: 'The Bitvavo provider is not yet implemented. Please use the Koios provider instead, which provides the same functionality.',
    fallback: 'You can use the Koios provider which works out of the box and provides comprehensive Cardano wallet data.',
    address: addr,
    provider: 'bitvavo',
    status: 'not_implemented'
  });
});
