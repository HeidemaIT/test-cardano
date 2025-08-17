import { Container, Typography } from '@mui/material';
import { BitvavoForm } from '../components/BitvavoForm';

export default function BitvavoPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Bitvavo
      </Typography>
      <BitvavoForm />
    </Container>
  );
}




