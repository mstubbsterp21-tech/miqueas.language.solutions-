// Legacy patch intentionally disabled.
// Admin document upload, download, replace, and delete now use the dedicated
// source-level endpoint at /api/admin-assets and the direct AdminInterpreterProfile source.
// Keeping this file as a safe no-op prevents older prebuild chains from failing.
console.log('Admin file actions patch skipped: direct source is authoritative.');
