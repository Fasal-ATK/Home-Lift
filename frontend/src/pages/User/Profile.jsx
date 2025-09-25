import React from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, Avatar, Typography, Box, Grid, Table, TableBody, TableRow, TableCell, Divider } from "@mui/material";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="text.secondary">
          No profile data found. Please log in again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="80vh" p={3}>
      <Grid container spacing={3} justifyContent="center">
        {/* Left Card: Avatar & Basic Info */}
        <Grid size = { {xs:12, sm:5 } }>
          <Card sx={{ borderRadius: 3, boxShadow: 4, textAlign: "center", p: 2, height: "100%", }}>
            <Avatar
              src={user.image || "/default-avatar.png"}
              alt={user.username}
              sx={{ width: 180, height: 180, mb: 2, mx: "auto" }}
            />
            <Typography variant="h6" fontWeight="bold">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              @{user.username}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">
              <strong>Phone:</strong> {user.phone || "Not provided"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email || "Not provided"}
            </Typography>
          </Card>
        </Grid>

        {/* Right Card: Detailed Info */}
        <Grid size = { {xs:12, sm:7 } }>
          <Card sx={{ borderRadius: 3, boxShadow: 4, p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              General Information
            </Typography>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>
                    {user.is_staff
                      ? "Admin"
                      : user.is_provider
                      ? "Provider"
                      : "User"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>{user.first_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Last Name</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>{user.last_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>{user.username}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Phone</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>{user.phone || "Not provided"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>:</TableCell>
                  <TableCell>{user.email || "Not provided"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
}
