import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AddressService } from '../services/addressService.js';

export const bitvavoRouter = Router();

// Apply authentication middleware to all routes
bitvavoRouter.use(authMiddleware.authenticate);

const AddressParamsSchema = z.object({
  addr: z.string().min(10),
});

bitvavoRouter.get(
  '/bitvavo/:addr/assets',
  validateParams(AddressParamsSchema),
  async (req, res) => {
    const { addr } = req.params as { addr: string };

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Bitvavo route called for address:', addr);
    }

    // Bitvavo provider is not implemented yet
    // If user is authenticated, save the address automatically (even though it's not implemented)
    if (req.user) {
      try {
        await AddressService.saveAddress(req.user.id, addr, 'bitvavo');
      } catch (error) {
        console.error('Failed to save address:', error);
        // Don't fail the request if saving fails
      }
    }

    return res.status(501).json({
      error: 'Bitvavo provider not implemented',
      suggestion:
        'The Bitvavo provider is not yet implemented. Please use the Koios provider instead, which provides the same functionality.',
      fallback:
        'You can use the Koios provider which works out of the box and provides comprehensive Cardano wallet data.',
      address: addr,
      provider: 'bitvavo',
      status: 'not_implemented',
      saved: req.user ? true : false,
    });
  },
);
