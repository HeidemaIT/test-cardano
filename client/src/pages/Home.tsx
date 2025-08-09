import { Box, Card, CardActionArea, CardContent, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Providers
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        }}
      >
        <Card>
          <CardActionArea component={Link} to="/koios">
            <CardContent>
              <Typography variant="h6">Koios</Typography>
              <Typography variant="body2" color="text.secondary">
                Query assets via Koios endpoints
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card>
          <CardActionArea component={Link} to="/cardanoscan">
            <CardContent>
              <Typography variant="h6">Cardanoscan</Typography>
              <Typography variant="body2" color="text.secondary">
                Query assets via Cardanoscan endpoints
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card>
          <CardActionArea component={Link} to="/custom">
            <CardContent>
              <Typography variant="h6">Custom</Typography>
              <Typography variant="body2" color="text.secondary">
                Query assets via your self-hosted provider
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Container>
  );
}


