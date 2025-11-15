import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Box, Button, Container, TextField, Typography, Paper } from '@mui/material';
import { api } from '../api/client';
import { useAppDispatch } from '../store/hooks';
import { setAuth } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

type Form = { email: string; password: string };
const schema = yup.object({ email: yup.string().email().required(), password: yup.string().required() });

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: Form) => {
    const res = await api.post('/users/login', data);
    dispatch(setAuth({ token: res.data.token, user: { id: res.data.user.id, email: res.data.user.email, role: res.data.user.role } }));
    navigate('/');
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth margin="normal" label="Email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField fullWidth margin="normal" label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2 }}>Sign In</Button>
        </Box>
      </Paper>
    </Container>
  );
}


