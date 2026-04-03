import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  CircularProgress, 
  Typography,
  Box
} from '@mui/material';

export default function AssignProviderModal({ open, onClose, onConfirm, providers, loading, selectedProviderId, setSelectedProviderId }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Assign Service Provider</DialogTitle>
            <DialogContent sx={{ pb: 1 }}>
                <Typography variant="body2" mb={3} color="text.secondary">
                    This booking requires a provider to be assigned before moving to the requested status. 
                    Please select an available provider below.
                </Typography>
                
                {loading ? (
                    <Box display="flex" justifyContent="center" my={3}>
                        <CircularProgress size={30} color="primary" />
                    </Box>
                ) : (
                    <FormControl fullWidth size="medium" sx={{ mt: 1 }}>
                        <InputLabel>Select Provider</InputLabel>
                        <Select
                            value={selectedProviderId}
                            label="Select Provider"
                            onChange={(e) => setSelectedProviderId(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            {providers.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    <Box>
                                        <Typography variant="body1">{p.full_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{p.phone}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                            {providers.length === 0 && (
                                <MenuItem disabled>
                                    <Typography color="error">No active providers available for this service</Typography>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                    onClick={onClose} 
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    onClick={onConfirm} 
                    disabled={!selectedProviderId || loading}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 'bold', 
                      borderRadius: 2, 
                      px: 3,
                      boxShadow: 2
                    }}
                >
                    Assign & Proceed
                </Button>
            </DialogActions>
        </Dialog>
    );
}
