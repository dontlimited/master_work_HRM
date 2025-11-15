import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, List, ListItem, ListItemText, Typography } from '@mui/material';

type Doc = { id: string; filename: string };

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['documents'], queryFn: async () => (await api.get('/documents')).data as Doc[] });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    await qc.invalidateQueries({ queryKey: ['documents'] });
  };

  return (
    <AppBarShell>
      <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" component="label">Upload<input hidden type="file" onChange={onUpload} /></Button>
      </Box>
      <List>
        {(data || []).map((d) => (
          <ListItem key={d.id} component="a" href={`/api/v1/documents/${d.id}/download`}>
            <ListItemText primary={d.filename} />
          </ListItem>
        ))}
      </List>
    </AppBarShell>
  );
}


