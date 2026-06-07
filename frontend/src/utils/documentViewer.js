// src/utils/documentViewer.js

/**
 * Opens a document in a new browser tab via our Django backend proxy.
 *
 * The proxy endpoint (GET /core/document-proxy/) fetches the Cloudinary file
 * server-side — bypassing all CORS/Content-Disposition issues — and returns
 * it with the correct headers.
 *
 * Because the proxy requires authentication, we fetch it with the stored
 * access token and create a local Blob URL for the new tab.
 *
 * Modes:
 *  - "inline"     → Content-Disposition: inline  → browser renders natively
 *  - "attachment" → Content-Disposition: attachment → browser saves the file
 *
 * Non-PDF / non-Cloudinary files still use direct navigation or Office Viewer.
 */

const BASE_URL    = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PROXY_URL   = `${BASE_URL}/core/document-proxy/`;
const CLOUDINARY  = /res\.cloudinary\.com/i;

/**
 * Fetches a URL through the authenticated Django proxy and opens the result
 * in a new browser tab as a Blob URL.
 *
 * @param {string} url   - Original Cloudinary URL
 * @param {string} mode  - "inline" | "attachment"
 */
const openViaProxy = async (url, mode = "inline") => {
  const token = localStorage.getItem("accessToken");

  // Open blank window immediately (within user gesture) to avoid popup blockers
  const newWindow = window.open("", "_blank");

  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>${mode === "inline" ? "Loading document…" : "Downloading…"}</title>
          <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{
              display:flex;flex-direction:column;align-items:center;
              justify-content:center;height:100vh;
              font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
              background:#f8fafc;color:#475569;
            }
            .loader{
              border:4px solid #e2e8f0;border-top:4px solid #6366f1;
              border-radius:50%;width:44px;height:44px;
              animation:spin .9s linear infinite;margin-bottom:18px;
            }
            @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            p{font-size:.85rem;color:#94a3b8;margin-top:6px}
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <strong>${mode === "inline" ? "Opening document…" : "Preparing download…"}</strong>
        </body>
      </html>
    `);
    newWindow.document.close();
  }

  try {
    const proxyEndpoint = `${PROXY_URL}?url=${encodeURIComponent(url)}&mode=${mode}`;
    const response = await fetch(proxyEndpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const blob    = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (newWindow) {
      newWindow.location.href = blobUrl;
    } else {
      window.open(blobUrl, "_blank");
    }

    // Clean up blob URL after a delay (browser keeps the data while tab is open)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    console.error("Document proxy error:", err);
    // Fallback: navigate directly to the original URL
    if (newWindow) {
      newWindow.location.href = url.replace(/^http:\/\//i, "https://");
    } else {
      window.open(url.replace(/^http:\/\//i, "https://"), "_blank");
    }
  }
};

/**
 * Opens a document inline in a new tab (View mode).
 */
export const openDocumentInNewTab = (url) => {
  if (!url) return;

  const secureUrl  = url.replace(/^http:\/\//i, "https://");
  const ext        = secureUrl.split("?")[0].split(".").pop().toLowerCase();
  const isOffice   = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(ext);
  const isPDF      = ext === "pdf";
  const isCloud    = CLOUDINARY.test(secureUrl);

  if ((isPDF || isOffice) && isCloud) {
    if (isOffice) {
      // Office docs: use Microsoft viewer with direct Cloudinary URL
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(secureUrl)}`,
        "_blank"
      );
    } else {
      // PDFs: route through authenticated backend proxy → inline
      openViaProxy(secureUrl, "inline");
    }
    return;
  }

  // Non-Cloudinary or image files — open directly
  window.open(secureUrl, "_blank");
};

/**
 * Triggers a file download via the authenticated backend proxy.
 */
export const downloadDocumentViaProxy = (url) => {
  if (!url) return;
  const secureUrl = url.replace(/^http:\/\//i, "https://");
  openViaProxy(secureUrl, "attachment");
};
