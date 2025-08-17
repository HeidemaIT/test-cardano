import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AddressService } from '../services/addressService.js';

export const addressesRouter = Router();

// Apply authentication middleware to all routes
addressesRouter.use(authMiddleware.authenticate);

// Schema for saving an address
const SaveAddressSchema = z.object({
  address: z.string().min(10, 'Address must be at least 10 characters'),
  provider: z.enum(['koios', 'cardanoscan', 'custom', 'bitvavo'], {
    errorMap: () => ({ message: 'Provider must be one of: koios, cardanoscan, custom, bitvavo' })
  }),
});

// Schema for address parameters
const AddressParamsSchema = z.object({
  address: z.string().min(10),
  provider: z.enum(['koios', 'cardanoscan', 'custom', 'bitvavo']),
});

// Get all saved addresses for the authenticated user
addressesRouter.get('/addresses', authMiddleware.requireAuth, async (req, res) => {
  try {
    const addresses = await AddressService.getAddressesByUser(req.user!.id);
    
    res.json({
      success: true,
      data: addresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({
      error: 'Failed to get saved addresses',
      message: 'An error occurred while retrieving your saved addresses',
    });
  }
});

// Get saved addresses for a specific provider
addressesRouter.get('/addresses/:provider', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!['koios', 'cardanoscan', 'custom', 'bitvavo'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be one of: koios, cardanoscan, custom, bitvavo',
      });
    }

    const addresses = await AddressService.getAddressesByUserAndProvider(req.user!.id, provider);
    
    res.json({
      success: true,
      data: addresses,
      count: addresses.length,
      provider,
    });
  } catch (error) {
    console.error('Error getting addresses by provider:', error);
    res.status(500).json({
      error: 'Failed to get saved addresses',
      message: 'An error occurred while retrieving your saved addresses',
    });
  }
});

// Save a new address
addressesRouter.post('/addresses', authMiddleware.requireAuth, async (req, res) => {
  try {
    const validation = SaveAddressSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: validation.error.errors[0].message,
      });
    }

    const { address, provider } = validation.data;

    // Check if address is already saved
    const isAlreadySaved = await AddressService.isAddressSaved(req.user!.id, address, provider);
    
    if (isAlreadySaved) {
      return res.status(409).json({
        error: 'Address already saved',
        message: 'This address is already saved for this provider',
      });
    }

    const savedAddress = await AddressService.saveAddress(req.user!.id, address, provider);
    
    res.status(201).json({
      success: true,
      data: savedAddress,
      message: 'Address saved successfully',
    });
  } catch (error) {
    console.error('Error saving address:', error);
    res.status(500).json({
      error: 'Failed to save address',
      message: 'An error occurred while saving the address',
    });
  }
});

// Remove a specific address
addressesRouter.delete('/addresses/:provider/:address', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { provider, address } = req.params;
    
    if (!['koios', 'cardanoscan', 'custom', 'bitvavo'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be one of: koios, cardanoscan, custom, bitvavo',
      });
    }

    const removed = await AddressService.removeAddress(req.user!.id, address, provider);
    
    if (!removed) {
      return res.status(404).json({
        error: 'Address not found',
        message: 'The specified address was not found in your saved addresses',
      });
    }

    res.json({
      success: true,
      message: 'Address removed successfully',
    });
  } catch (error) {
    console.error('Error removing address:', error);
    res.status(500).json({
      error: 'Failed to remove address',
      message: 'An error occurred while removing the address',
    });
  }
});

// Remove all addresses for the user
addressesRouter.delete('/addresses', authMiddleware.requireAuth, async (req, res) => {
  try {
    const removedCount = await AddressService.removeAllAddresses(req.user!.id);
    
    res.json({
      success: true,
      message: `Successfully removed ${removedCount} saved addresses`,
      count: removedCount,
    });
  } catch (error) {
    console.error('Error removing all addresses:', error);
    res.status(500).json({
      error: 'Failed to remove addresses',
      message: 'An error occurred while removing your saved addresses',
    });
  }
});

// Check if an address is saved
addressesRouter.get('/addresses/:provider/:address/check', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { provider, address } = req.params;
    
    if (!['koios', 'cardanoscan', 'custom', 'bitvavo'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be one of: koios, cardanoscan, custom, bitvavo',
      });
    }

    const isSaved = await AddressService.isAddressSaved(req.user!.id, address, provider);
    
    res.json({
      success: true,
      data: {
        address,
        provider,
        isSaved,
      },
    });
  } catch (error) {
    console.error('Error checking address:', error);
    res.status(500).json({
      error: 'Failed to check address',
      message: 'An error occurred while checking the address',
    });
  }
});
