import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

const PrintDialog = ({
  open,
  onClose,
  title,
  children,
}) => {
  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="no-print" sx={{ bgcolor: "#D32F2F", color: "#fff" }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#fff" }}>
        <Box
          sx={{
            "@media print": {
              p: 0,
            },
          }}
        >
          {children}
        </Box>
      </DialogContent>
      <DialogActions className="no-print" sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handlePrint} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintDialog;
