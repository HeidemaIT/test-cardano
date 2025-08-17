import { Box, Chip, Typography, IconButton, Tooltip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface SavedAddressesProps {
  addresses: string[];
  onAddressClick: (address: string) => void;
  onAddressRemove: (address: string) => void;
  onClearAll: () => void;
}

export function SavedAddresses({ addresses, onAddressClick, onAddressRemove, onClearAll }: SavedAddressesProps) {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Saved addresses:
        </Typography>
        {addresses.length > 1 && (
          <Tooltip title="Clear all saved addresses">
            <IconButton size="small" onClick={onClearAll} sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {addresses.map((address) => (
          <Chip
            key={address}
            label={address}
            size="small"
            clickable
            onClick={() => onAddressClick(address)}
            onDelete={() => onAddressRemove(address)}
            sx={{
              maxWidth: '200px',
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
