export const getErrorMessage = (err, defaultMsg = "An error occurred.") => {
  if (!err) return defaultMsg;

  // Handle Axios error object recursively
  if (typeof err === "object" && err !== null) {
    if (err.response?.data) {
      return getErrorMessage(err.response.data, defaultMsg);
    }
    if (err.message && typeof err.message === "string" && !err.response) {
      // Network errors or other standard JS errors without response data
      const lowerMsg = err.message.toLowerCase();
      if (lowerMsg.includes("<html") || lowerMsg.startsWith("<!doctype")) {
        return defaultMsg;
      }
      return err.message;
    }
  }

  if (typeof err === "string") {
    const trimmed = err.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Check if it is HTML
    if (
      lowerTrimmed.startsWith("<!doctype") || 
      lowerTrimmed.includes("<html") || 
      lowerTrimmed.includes("<body") ||
      lowerTrimmed.includes("h1>bad request") ||
      lowerTrimmed.includes("h1>internal server error")
    ) {
      return defaultMsg;
    }

    // Try parsing if it looks like stringified JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(err);
        return getErrorMessage(parsed, defaultMsg);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(err)) {
    return err.map(e => getErrorMessage(e, defaultMsg)).filter(Boolean).join(", ");
  }

  if (typeof err === "object" && err !== null) {
    // Check common error fields
    if (err.error && typeof err.error === "string") {
      return getErrorMessage(err.error, defaultMsg);
    }
    if (err.detail && typeof err.detail === "string") {
      return getErrorMessage(err.detail, defaultMsg);
    }
    if (err.message && typeof err.message === "string") {
      return getErrorMessage(err.message, defaultMsg);
    }
    
    if (err.non_field_errors) {
      return Array.isArray(err.non_field_errors)
        ? err.non_field_errors.map(e => getErrorMessage(e, defaultMsg)).join(", ")
        : getErrorMessage(err.non_field_errors, defaultMsg);
    }

    // Handle field validation errors (e.g. { amount: ["This field is required"] })
    const values = Object.values(err);
    if (values.length > 0) {
      const firstVal = values[0];
      if (Array.isArray(firstVal)) {
        return firstVal.map(e => getErrorMessage(e, defaultMsg)).join(", ");
      }
      if (typeof firstVal === "object") {
        return getErrorMessage(firstVal, defaultMsg);
      }
      if (typeof firstVal === "string") {
        return getErrorMessage(firstVal, defaultMsg);
      }
    }
  }

  // Final fallback
  return defaultMsg;
};
