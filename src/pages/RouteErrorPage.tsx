import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { strings } from "../strings";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Error ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function RouteErrorPage() {
  const error = useRouteError();
  const message = getErrorMessage(error);
  const showStack =
    import.meta.env.DEV && error instanceof Error && Boolean(error.stack);

  return (
    <div className="route-error-page">
      <div className="route-error-card">
        <div role="alert">
          <h1 className="route-error-title">{strings.routeError.title}</h1>
          <p className="route-error-description">
            {strings.routeError.description}
          </p>
          <p className="route-error-message">{message}</p>
        </div>
        {showStack ? (
          <details className="route-error-details">
            <summary>{strings.routeError.detailsSummary}</summary>
            <pre className="route-error-pre">{error.stack}</pre>
          </details>
        ) : null}
        <div className="route-error-actions">
          <Link to="/" className="btn btn-primary">
            {strings.routeError.backHome}
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            {strings.routeError.reload}
          </button>
        </div>
      </div>
    </div>
  );
}
