import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Button,
} from "@mui/material";

import ReusableFormModal from "../../components/user/modals/EditFormModal";
import { updateUser } from "../../redux/slices/user/userSlice";
import { setUser } from "../../redux/slices/authSlice";
import { ShowToast } from "../../components/common/Toast";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="text.secondary">
          No profile data found. Please log in again.
        </Typography>
      </Box>
    );
  }

  // Fields for edit modal
  const profileFields = [
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
    { name: "username", label: "Username" },
    { name: "email", label: "Email", readOnly: true },
    { name: "phone", label: "Phone" },
  ];

  // Handle profile update
const handleSave = async (updatedData) => {
  try {
    const resultAction = await dispatch(updateUser(updatedData));

    if (updateUser.fulfilled.match(resultAction)) {
      dispatch(setUser(resultAction.payload.user)); // update auth slice
      setOpen(false);
      ShowToast("Profile updated successfully!");
    } else {
      ShowToast("Failed to update profile. Please try again.", "error");
    }
  } catch (error) {
    console.error("Profile update failed:", error);
    ShowToast("Unexpected error updating profile.", "error");
  }
};

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="80vh" p={3}>
      <Grid container spacing={3} justifyContent="center">
        {/* Left Card */}
        <Grid item xs={12} sm={6} md={6.5}>
          <Card sx={{ borderRadius: 3, boxShadow: 4, textAlign: "center", p: 2, height: "100%" }}>
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

        {/* Right Card */}
        <Grid item xs={12} sm={6} md={5.5}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 4,
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                General Information
              </Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell>
                      {user.is_staff ? "Admin" : user.is_provider ? "Provider" : "User"}
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
            </CardContent>

            <Box sx={{ textAlign: "right", mt: 2 }}>
              <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                Edit Profile
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <ReusableFormModal
        open={open}
        handleClose={() => setOpen(false)}
        title="Edit Profile"
        fields={profileFields}
        initialData={user}
        onSave={handleSave}
      />
    </Box>
  );
}
