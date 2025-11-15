import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import PageHeader from '../components/PageHeader';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  ExpandMore,
  ChevronRight,
  Add,
  Edit,
  Delete,
  Business,
} from '@mui/icons-material';

type Department = {
  id: string;
  name: string;
  parentId: string | null;
  children?: Department[];
  _count?: { employees: number; directEmployees?: number };
};

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', parentId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () =>
      (await api.get('/departments')).data as Department[],
  });

  const { data: orgTree } = useQuery({
    queryKey: ['departments-org'],
    queryFn: async () =>
      (await api.get('/departments/org')).data as Department[],
  });

  // Recursively count employees including all children
  // Backend returns both direct and total counts
  const countEmployeesRecursive = (
    deptId: string,
    allDepts: Department[]
  ): number => {
    const dept = allDepts.find((d) => d.id === deptId);
    if (!dept) return 0;

    // Use direct count if available, otherwise fall back to total
    const directCount = dept._count?.directEmployees ?? dept._count?.employees ?? 0;
    
    const children = allDepts.filter((d) => d.parentId === deptId);
    
    if (children.length === 0) {
      // Leaf department: return direct count
      return directCount;
    }
    
    // Parent department: sum direct employees + all children's employees
    const childrenTotal = children.reduce((sum, child) => {
      return sum + countEmployeesRecursive(child.id, allDepts);
    }, 0);
    
    return directCount + childrenTotal;
  };

  // Build tree structure from flat list recursively with correct employee counts
  const buildTree = (
    items: Department[],
    parentId: string | null = null,
    allItems: Department[] = items
  ): Department[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = buildTree(items, item.id, allItems);
        
        // Recalculate total employees to ensure parent includes all children
        const totalEmployees = orgTree 
          ? countEmployeesRecursive(item.id, orgTree)
          : (item._count?.employees || 0);
        
        return {
          ...item,
          _count: {
            employees: totalEmployees,
          },
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const treeData = orgTree ? buildTree(orgTree) : [];

  const allDepartments =
    departments?.map((d) => ({
      value: d.id,
      label: d.name,
    })) || [];

  const handleOpen = (dept?: Department) => {
    if (dept) {
      setEditingId(dept.id);
      setForm({
        name: dept.name,
        parentId: dept.parentId || '',
      });
    } else {
      setEditingId(null);
      setForm({ name: '', parentId: '' });
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm({ name: '', parentId: '' });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const payload: { name: string; parentId?: string } = {
        name: form.name.trim(),
      };
      if (form.parentId) {
        payload.parentId = form.parentId;
      }

      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      handleClose();
      await qc.invalidateQueries({ queryKey: ['departments'] });
      await qc.invalidateQueries({ queryKey: ['departments-org'] });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors({ name: 'Department with this name already exists' });
      } else {
        setErrors({
          name: error.response?.data?.error || 'Failed to save department',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    try {
      await api.delete(`/departments/${id}`);
      await qc.invalidateQueries({ queryKey: ['departments'] });
      await qc.invalidateQueries({ queryKey: ['departments-org'] });
    } catch (error: any) {
      alert(
        error.response?.data?.error ||
          'Cannot delete department. It may have children or employees.'
      );
    }
  };

  const renderTree = (nodes: Department[], level: number = 0): JSX.Element[] => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
              width: '100%',
            }}
          >
            <Business sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body1" sx={{ flex: 1, fontWeight: 600 }}>
              {node.name}
            </Typography>
            {node._count && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mr: 1 }}
              >
                ({node._count.employees} employees)
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen(node);
                }}
                sx={{ color: 'primary.main' }}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node.id);
                }}
                sx={{ color: 'error.main' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        }
        sx={{
          '& .MuiTreeItem-content': {
            paddingLeft: `${level * 2 + 1}rem`,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
      >
        {node.children && node.children.length > 0
          ? renderTree(node.children, level + 1)
          : null}
      </TreeItem>
    ));
  };

  const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (_event: React.SyntheticEvent, nodeId: string) => {
    setSelected(nodeId === selected ? null : nodeId);
  };

  return (
    <AppBarShell>
      <PageHeader
        title="Departments"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Department
          </Button>
        }
      />

      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 3,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Organizational Structure
        </Typography>
        {treeData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
            No departments found. Create the first department to get started.
          </Typography>
        ) : (
          <SimpleTreeView
            expandedItems={expanded}
            selectedItems={selected}
            onExpandedItemsChange={(_, newExpanded) => setExpanded(newExpanded)}
            onSelectedItemsChange={(_, newSelected) => setSelected(newSelected.length > 0 ? newSelected[0] : null)}
            sx={{
              flexGrow: 1,
              maxWidth: '100%',
              overflowY: 'auto',
              minHeight: 400,
            }}
          >
            {renderTree(treeData)}
          </SimpleTreeView>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Department' : 'New Department'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Department Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>Parent Department (Optional)</InputLabel>
              <Select
                label="Parent Department (Optional)"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>None (Top Level)</em>
                </MenuItem>
                {allDepartments
                  .filter((d) => d.value !== editingId)
                  .map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
              </Select>
              {form.parentId && (
                <FormHelperText>
                  This department will be a child of the selected parent
                  department
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBarShell>
  );
}

