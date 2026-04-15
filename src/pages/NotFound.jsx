import React from "react";
import { Link } from "react-router-dom";

export default function NotFound({ palette }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-20 text-center">
      <h1 className="text-4xl font-bold" style={{ color: palette.charcoal }}>
        404 - Page Not Found
      </h1>
      <p className="mt-4 text-base" style={{ color: palette.body }}>
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="btn btn-primary mt-6 inline-flex items-center gap-2"
      >
        Return Home
      </Link>
    </div>
  );
}