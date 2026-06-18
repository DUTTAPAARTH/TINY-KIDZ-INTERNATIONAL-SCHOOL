import {
  Drawer,
  Toolbar,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

const drawerWidth = 260;

const Sidebar = ({ menuItems = [], activePath = "", onMenuClick }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onMenuClick(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  backgroundColor:
                    activePath === item.path ? "#D32F2F" : "transparent",
                  color: activePath === item.path ? "#ffffff" : "#333333",
                  "&:hover": {
                    backgroundColor:
                      activePath === item.path ? "#C62828" : "#f5f5f5",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activePath === item.path ? "#ffffff" : "#D32F2F",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: activePath === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
