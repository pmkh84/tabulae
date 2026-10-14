import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useState, useEffect } from "react";
import { register as registerAPI } from "../api/auth";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Register() {
  const { isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await registerAPI({ name, email, password });
      setSuccessMsg(t("auth.registered"));
    } catch (error) {
      setErrorMsg(errorMessage(error));
    }
  };

  useEffect(() => {
    document.title = t("auth.register");
  }, []);

  if (isLoading) return <p role="status" className="p-6">{t("common.loading")}</p>;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">{t("auth.createAccount")}</h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm/6 font-medium text-gray-900"
            >{t("common.name")}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              className="mt-2 block w-full rounded-md px-3 py-1.5 bg-white text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-900"
            >{t("common.email")}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={100}
              className="mt-2 block w-full rounded-md px-3 py-1.5 bg-white text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm/6 font-medium text-gray-900"
            >{t("common.password")}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={255}
              required
              className="mt-2 block w-full rounded-md px-3 py-1.5 bg-white text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>

          {errorMsg && <p className="text-red-500 text-sm whitespace-pre-line" role="alert">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

          <div>
            <button
              role="button"
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-white font-semibold hover:bg-indigo-500"
            >{t("auth.register")}</button>
            <p className="mt-4 text-center text-sm text-gray-600">{t("auth.hasAccount")}{" "}
              <a
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >{t("auth.signIn")}</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
