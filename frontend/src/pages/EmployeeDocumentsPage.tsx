import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, IconButton, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type Doc = { id: string; filename: string; category?: string; tags?: string[]; version: number };

export default function EmployeeDocumentsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['employee-docs', id], queryFn: async () => (await api.get('/documents', { params: { employeeId: id } })).data as Doc[] });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const form = new FormData();
    form.append('file', file);
    form.append('employeeId', id);
    if ((document.getElementById('docCategory') as HTMLInputElement)?.value) form.append('category', (document.getElementById('docCategory') as HTMLInputElement).value);
    if ((document.getElementById('docTags') as HTMLInputElement)?.value) form.append('tags', (document.getElementById('docTags') as HTMLInputElement).value);
    await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    await qc.invalidateQueries({ queryKey: ['employee-docs', id] });
  };

  const remove = async (docId: string) => {
    await api.delete(`/documents/${docId}`);
    await qc.invalidateQueries({ queryKey: ['employee-docs', id] });
  };

  return (
    <AppBarShell>
      <Typography variant="h6" sx={{ mb: 2 }}>Employee Documents</Typography>
      <Card>
        <CardHeader title="Upload" />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField id="docCategory" size="small" label="Category" />
            <TextField id="docTags" size="small" label="Tags (comma-separated)" />
            <Button variant="contained" component="label">Choose File<input hidden type="file" onChange={onUpload} /></Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Files" />
        <CardContent>
          <List>
            {(data || []).map((d) => (
              <ListItem key={d.id} secondaryAction={<IconButton onClick={() => remove(d.id)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={`${d.filename} (v${d.version})`} secondary={`Category: ${d.category || '-'} | Tags: ${(d.tags || []).join(', ') || '-'}`} />
                <Button size="small" href={`/api/v1/documents/${d.id}/download`}>Download</Button>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </AppBarShell>
  );
}


