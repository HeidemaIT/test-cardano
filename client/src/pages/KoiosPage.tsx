import { Container, Typography } from '@mui/material';
import { KoiosForm } from '../components/KoiosForm';

export default function KoiosPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Koios Provider
      </Typography>
      <KoiosForm />
    </Container>
  );
}


