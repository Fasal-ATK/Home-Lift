// components/admin/CategoryTable.jsx
import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete, ToggleOn, ToggleOff } from "@mui/icons-material";
import DataTable from "./DataTable";

function CategoryTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description", sortable: true },
    {
      key: "icon",
      label: "Icon",
      render: (row) =>
        row.icon ? (
          <img
            src={row.icon}
            alt={row.name}
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDelete(row)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={row.is_active ? "Deactivate" : "Activate"}>
            <IconButton
              color={row.is_active ? "success" : "warning"}
              size="small"
              onClick={() => handleToggleActive(row)}
            >
              {row.is_active ? (
                <ToggleOn fontSize="large" />
              ) : (
                <ToggleOff fontSize="large" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // mock fetch
  useEffect(() => {
    setTimeout(() => {
      setRows([
        {
          id: 1,
          name: "Plumbing",
          description: "All plumbing works",
          icon: "https://via.placeholder.com/40",
          is_active: true,
        },
        {
          id: 2,
          name: "Electrical",
          description: "Electrical installations",
          icon: "",
          is_active: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleEdit = (row) => {
    console.log("Edit clicked:", row);
    // open edit modal or navigate to edit page
  };

  const handleDelete = (row) => {
    console.log("Delete clicked:", row);
    // confirm delete then update state or call API
  };

  const handleToggleActive = (row) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, is_active: !item.is_active } : item
      )
    );
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters + sorting
  const filteredRows = rows
    .filter((row) => {
      if (!searchQuery) return true;
      return (
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active" ? row.is_active : !row.is_active;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <Box>
      <DataTable
        title="Service Categories"
        columns={columns}
        rows={filteredRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </Box>
  );
}

export default CategoryTable;
