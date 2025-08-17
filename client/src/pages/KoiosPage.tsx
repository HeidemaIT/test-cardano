import { Container, Typography } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import { KoiosForm } from '../components/KoiosForm';

export default function KoiosPage() {
  const location = useLocation();
  const { address: urlAddress } = useParams<{ address: string }>();
  const selectedAddress = location.state?.selectedAddress;

  // Priority: URL parameter > location state > undefined
  const initialAddress = urlAddress || selectedAddress;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Koios Provider
      </Typography>
      <KoiosForm initialAddress={initialAddress} />
    </Container>
  );
}


