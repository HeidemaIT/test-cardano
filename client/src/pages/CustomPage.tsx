import { Container, Typography } from '@mui/material';
import { CustomForm } from '../components/CustomForm';

export default function CustomPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Custom Provider
      </Typography>
      <CustomForm />
    </Container>
  );
}


