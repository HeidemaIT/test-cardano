import { Container, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { KoiosForm } from '../components/KoiosForm';

export default function KoiosPage() {
  const location = useLocation();
  const selectedAddress = location.state?.selectedAddress;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Koios Provider
      </Typography>
      <KoiosForm initialAddress={selectedAddress} />
    </Container>
  );
}


