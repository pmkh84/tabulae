export default function ErrorMessage({ message }) {
  if (!message) return null;

  return <p role="alert" className="text-red-500 text-xs mt-1 whitespace-pre-line">{message}</p>;
}
