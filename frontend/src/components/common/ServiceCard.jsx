import React from "react";
import { Paper, Box, Typography } from "@mui/material";

/**
 * Reusable ServiceCard component for displaying categories or services.
 * 
 * @param {string} name - The name of the service/category.
 * @param {string} icon - The icon or image URL.
 * @param {function} onClick - Handle card click.
 * @param {boolean} selected - Whether the card is in a selected state (used in Categories).
 * @param {boolean} isMore - Special styling for the "More Services" card.
 * @param {object} sx - Additional styles to override defaults.
 */
const ServiceCard = ({
    name,
    icon,
    onClick,
    selected = false,
    isMore = false,
    sx = {}
}) => {
    return (
        <Paper
            onClick={onClick}
            elevation={selected ? 4 : 1}
            sx={{
                width: "100%",
                maxWidth: 130,
                height: 140,
                textAlign: "center",
                backgroundColor: selected ? "#f0f8ff" : "white",
                border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    backgroundColor: "#f9f9f9",
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                },
                p: isMore ? 1 : 0,
                ...sx,
            }}
        >
            <Box
                component="img"
                src={icon || ""}
                alt={name}
                sx={{
                    width: 60,
                    height: 60,
                    objectFit: "contain",
                    mb: isMore ? 1 : 2,
                    pt: isMore ? 0 : 2,
                    opacity: icon ? 1 : 0.3,
                }}
            />
            <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                    textAlign: "center",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    px: 1,
                    lineHeight: 1.2,
                    fontSize: "0.85rem",
                    color: selected ? "primary.main" : "text.primary"
                }}
            >
                {name}
            </Typography>
        </Paper>
    );
};

export default ServiceCard;
