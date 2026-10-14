export default function ErrorMessage({ message, id }) {
  if (!message) return null;

  return <p id={id} role="alert" className="text-red-500 text-xs mt-1 whitespace-pre-line">{message}</p>;
}
