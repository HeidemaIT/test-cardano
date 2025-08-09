import { Container, Typography } from '@mui/material';
import { CardanoscanForm } from '../components/CardanoscanForm';

export default function CardanoscanPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Cardanoscan Provider
      </Typography>
      <CardanoscanForm />
    </Container>
  );
}


