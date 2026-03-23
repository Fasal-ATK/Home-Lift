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
 * @param {object} offer - Offer data if available.
 * @param {object} sx - Additional styles to override defaults.
 */
const ServiceCard = ({
    name,
    icon,
    onClick,
    selected = false,
    isMore = false,
    offer = null,
    price = null,
    sx = {}
}) => {
    return (
        <Paper
            onClick={onClick}
            elevation={selected ? 4 : 1}
            sx={{
                width: "100%",
                maxWidth: 130,
                minHeight: 160, // Increased from 140 to ensure content fits better
                height: "auto",
                textAlign: "center",
                backgroundColor: selected ? "#f0f8ff" : "white",
                border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: isMore ? "center" : "flex-start", // Centered for "More" button, top for others

                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "visible", // Allow content to show on hover if it overflows
                zIndex: 1,
                "&:hover": {
                    backgroundColor: "#f9f9f9",
                    transform: "translateY(-9px) scale(1)", // Slightly less scale but more lift
                    boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                    zIndex: 20,
                    // The border "expands" because we allow overflow and scaled box
                },
                p: isMore ? 1 : 1.5,
                pb: 2, 
                ...sx,
            }}
        >
            {/* Offer Ribbon - wrapped in a clipping mask container */}
            {offer && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: "hidden",
                        borderRadius: "12px",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            right: -30,
                            backgroundColor: "#f2b705",
                            color: "black",
                            px: 4,
                            py: 0.5,
                            transform: "rotate(45deg)",
                            fontSize: "0.65rem",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {offer.discount_type === 'percentage'
                            ? `${parseInt(offer.discount_value)}% OFF`
                            : `SAVE ₹${parseInt(offer.discount_value)}`}
                    </Box>
                </Box>
            )}

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
                    mt: offer ? 1 : 0, // Push down slightly if there's an offer
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

            {price && (
                <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {offer ? (
                        <>
                            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textDecoration: "line-through", fontSize: "0.7rem" }}
                                >
                                    ₹{price}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="success.main"
                                    sx={{ fontSize: "0.75rem" }}
                                >
                                    ₹{(() => {
                                        const p = Number(price);
                                        const dv = Number(offer.discount_value);
                                        let final = p;
                                        if (offer.discount_type === 'percentage') {
                                            let disc = (p * dv) / 100;
                                            if (offer.max_discount) disc = Math.min(disc, Number(offer.max_discount));
                                            final = p - disc;
                                        } else {
                                            final = p - dv;
                                        }
                                        return Math.max(final, 0).toFixed(0);
                                    })()}
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            ₹{price}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default ServiceCard;
