export const getErrorMessage = (err, defaultMsg = "An error occurred.") => {
  if (!err) return defaultMsg;

  if (typeof err === "string") {
    // Try parsing if it looks like stringified JSON
    if (err.trim().startsWith("{") || err.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(err);
        return getErrorMessage(parsed, defaultMsg);
      } catch {
        return err;
      }
    }
    return err;
  }

  if (Array.isArray(err)) {
    return err.map(e => getErrorMessage(e)).filter(Boolean).join(", ");
  }

  if (typeof err === "object") {
    // Check common error fields
    if (err.error && typeof err.error === "string") return err.error;
    if (err.detail && typeof err.detail === "string") return err.detail;
    if (err.message && typeof err.message === "string") return err.message;
    
    if (err.non_field_errors) {
      return Array.isArray(err.non_field_errors)
        ? err.non_field_errors.join(", ")
        : String(err.non_field_errors);
    }

    // Handle field validation errors (e.g. { amount: ["This field is required"] })
    const values = Object.values(err);
    if (values.length > 0) {
      const firstVal = values[0];
      if (Array.isArray(firstVal)) {
        return firstVal.join(", ");
      }
      if (typeof firstVal === "object") {
        return getErrorMessage(firstVal);
      }
      if (typeof firstVal === "string") {
        return firstVal;
      }
    }
  }

  // Final fallback (avoid stringifying whole big objects if possible, return default)
  return defaultMsg;
};
