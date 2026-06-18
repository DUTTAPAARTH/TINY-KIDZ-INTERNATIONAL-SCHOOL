import { AppBar, Toolbar, Box, Typography, IconButton } from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";

const Navbar = ({
  schoolName = "Tiny Kidz International School",
  onLogout,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "#D32F2F",
      }}
    >
      <Toolbar>
        <Box
          component="img"
          src="/logo.png"
          alt="Tiny Kidz Logo"
          sx={{ height: 45, marginRight: 2 }}
        />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          {schoolName}
        </Typography>
        <IconButton
          color="inherit"
          onClick={onLogout}
          sx={{
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
