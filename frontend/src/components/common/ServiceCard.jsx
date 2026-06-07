import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

/**
 * Reusable ServiceCard component for displaying categories or services.
 *
 * @param {string} name - The name of the service/category.
 * @param {string} icon - The icon or image URL.
 * @param {function} onClick - Handle card click.
 * @param {boolean} selected - Whether the card is in a selected state (used in Categories).
 * @param {boolean} isMore - Special styling for the "More Services" card.
 * @param {object} offer - Offer data if available.
 * @param {number} price - Price of the service.
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
  sx = {},
}) => {
  const calcDiscountedPrice = () => {
    if (!price || !offer) return null;
    const p = Number(price);
    const dv = Number(offer.discount_value);
    let final = p;
    if (offer.discount_type === "percentage") {
      let disc = (p * dv) / 100;
      if (offer.max_discount) disc = Math.min(disc, Number(offer.max_discount));
      final = p - disc;
    } else {
      final = p - dv;
    }
    return Math.max(final, 0).toFixed(0);
  };

  const discountedPrice = calcDiscountedPrice();
  const offerLabel =
    offer &&
    (offer.discount_type === "percentage"
      ? `${parseInt(offer.discount_value)}% OFF`
      : `SAVE ₹${parseInt(offer.discount_value)}`);

  const isServiceCard = price !== null;

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "18px",
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        background: selected
          ? "linear-gradient(145deg, #eef2ff, #e0e7ff)"
          : "white",
        border: selected
          ? "2px solid #6366f1"
          : "1.5px solid rgba(0,0,0,0.07)",
        boxShadow: selected
          ? "0 8px 24px rgba(99, 102, 241, 0.25)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isServiceCard ? "flex-start" : "center",
        p: isServiceCard ? 0 : 1.5,
        pb: isServiceCard ? 0 : 2,
        minHeight: isServiceCard ? 200 : 140,
        "&:hover": {
          transform: "translateY(-8px) scale(1.02)",
          boxShadow: selected
            ? "0 20px 40px rgba(99, 102, 241, 0.3)"
            : "0 16px 36px rgba(0,0,0,0.14)",
          borderColor: selected ? "#4f46e5" : "#a5b4fc",
          background: selected
            ? "linear-gradient(145deg, #e0e7ff, #c7d2fe)"
            : "linear-gradient(145deg, #fafafa, #f5f5ff)",
          zIndex: 10,
        },
        ...sx,
      }}
    >
      {/* Offer Badge */}
      {offer && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 0,
            background: "linear-gradient(90deg, #f59e0b, #ef4444)",
            color: "#fff",
            px: 1.2,
            py: 0.3,
            borderRadius: "0 8px 8px 0",
            display: "flex",
            alignItems: "center",
            gap: 0.4,
            zIndex: 5,
            boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 10 }} />
          <Typography
            sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5 }}
          >
            {offerLabel}
          </Typography>
        </Box>
      )}

      {/* Icon area */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pt: isServiceCard ? (offer ? 3.5 : 2) : 1,
          pb: isServiceCard ? 1.5 : 1,
        }}
      >
        <Box
          sx={{
            width: isServiceCard ? 72 : 58,
            height: isServiceCard ? 72 : 58,
            borderRadius: isServiceCard ? "20px" : "16px",
            background: selected
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: selected
              ? "0 6px 18px rgba(99,102,241,0.4)"
              : "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.35s ease",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={icon || ""}
            alt={name}
            sx={{
              width: isServiceCard ? 48 : 38,
              height: isServiceCard ? 48 : 38,
              objectFit: "contain",
              opacity: icon ? 1 : 0.25,
            }}
          />
        </Box>
      </Box>

      {/* Name */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          fontWeight: selected ? 800 : 600,
          fontSize: isServiceCard ? "0.88rem" : "0.8rem",
          color: selected ? "#4f46e5" : "#1e293b",
          px: 1.5,
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          mb: isServiceCard ? 0.5 : 0,
        }}
      >
        {name}
      </Typography>

      {/* Price block — service cards only */}
      {isServiceCard && (
        <Box
          sx={{
            mt: "auto",
            width: "100%",
            px: 1.5,
            pb: 1.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.3,
          }}
        >
          {offer ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#94a3b8",
                    textDecoration: "line-through",
                  }}
                >
                  ₹{price}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#16a34a",
                    lineHeight: 1,
                  }}
                >
                  ₹{discountedPrice}
                </Typography>
              </Box>
              <Chip
                label={offerLabel}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  background: "linear-gradient(90deg,#fef3c7,#fde68a)",
                  color: "#92400e",
                  border: "1px solid #f59e0b",
                  "& .MuiChip-label": { px: 0.8 },
                }}
              />
            </>
          ) : (
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#4f46e5",
              }}
            >
              ₹{price}
            </Typography>
          )}
        </Box>
      )}

      {/* Bottom accent bar when selected */}
      {selected && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: "15%",
            right: "15%",
            height: 3,
            borderRadius: "3px 3px 0 0",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }}
        />
      )}
    </Box>
  );
};

export default ServiceCard;
