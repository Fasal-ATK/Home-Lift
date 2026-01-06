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
  CircularProgress,
} from "@mui/material";
import ImageUploading from "react-images-uploading";
import { useNavigate } from 'react-router-dom';

import ReusableFormModal from "../../components/user/modals/EditFormModal";
import { updateUser } from "../../redux/slices/user/userSlice";
import { setUser } from "../../redux/slices/authSlice";
import { ShowToast } from "../../components/common/Toast";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxNumber = 1;

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="text.secondary">
          No profile data found. Please log in again.
        </Typography>
      </Box>
    );
  }

  // Editable fields for modal
  const profileFields = [
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
    { name: "username", label: "Username" },
    { name: "email", label: "Email", readOnly: true },
    { name: "phone", label: "Phone" },
  ];

  // Image selection handler
  const onImageChange = (imageList) => {
    setImages(imageList);
  };

  // Core save logic for both info and image update
  const handleSave = async (updatedData = {}) => {
    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(updatedData).forEach(([key, value]) => {
        // Avoid appending profile_picture from modal (only file upload should handle it)
        if (key !== "profile_picture" && value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Append profile image only if user selected a new one
      if (images?.[0]?.file) {
        formData.append("profile_picture", images[0].file);
      }

      const resultAction = await dispatch(updateUser(formData));

      if (updateUser.fulfilled.match(resultAction)) {
        const updatedUser = resultAction.payload.user || resultAction.payload;

        // Optimistically show the updated photo (even before backend finishes)
        if (images?.[0]?.data_url) {
          updatedUser.profile_picture = images[0].data_url;
        }

        dispatch(setUser(updatedUser));
        ShowToast("Profile updated successfully!", "success");
        setOpen(false);
        setImages([]);
      } else {
        ShowToast("Failed to update profile. Please try again.", "error");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      ShowToast("Unexpected error updating profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSave = () => handleSave({});

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="80vh" p={3}>
      <Grid container spacing={3} justifyContent="center">
        {/* Left: Avatar + Basic Info */}
        <Grid item xs={12} sm={6} md={6.5}>
          <Card sx={{ borderRadius: 3, boxShadow: 4, textAlign: "center", p: 2, height: "100%" }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <ImageUploading
                value={images}
                onChange={onImageChange}
                maxNumber={maxNumber}
                dataURLKey="data_url"
              >
                {({ imageList, onImageUpload, onImageRemoveAll }) => (
                  <div style={{ textAlign: "center" }}>
                    <Avatar
                      src={
                        imageList.length > 0
                          ? imageList[0]["data_url"]
                          : user.profile_picture || "/default-avatar.png"
                      }
                      alt={user.username}
                      sx={{
                        width: 180,
                        height: 180,
                        mb: 2,
                        mx: "auto",
                        border: "3px solid #1976d2",
                      }}
                    />

                    <Box display="flex" justifyContent="center" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={onImageUpload}
                        sx={{ textTransform: "none" }}
                      >
                        Change Photo
                      </Button>
                      {imageList.length > 0 && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={onImageRemoveAll}
                          sx={{ textTransform: "none" }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                  </div>
                )}
              </ImageUploading>

              <Typography variant="h6" fontWeight="bold" mt={2}>
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                @{user.username}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2">
              <strong>Phone:</strong> {user.phone || "Not provided"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email || "Not provided"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="center">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => navigate('/change-password')}
                sx={{ textTransform: "none", width: '100%' }}
              >
                Change Password
              </Button>
            </Box>
          </Card>

          
        </Grid>

        {/* Right: General Info */}
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
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                disabled={loading}
              >
                Edit Profile
              </Button>
              {/* New My Addresses Button */}
              <Button
                variant="contained"
                color="secondary"
                sx={{ ml: 2 }}
                onClick={() => navigate("/addresses")}
              >
                My Addresses
              </Button>
              {images.length > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ ml: 2 }}
                  onClick={handlePhotoSave}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Save Photo"}
                </Button>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Info Modal */}
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
