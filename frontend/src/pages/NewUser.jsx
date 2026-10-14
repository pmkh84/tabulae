import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { createUser } from "../api/users";

export default function NewUser() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t("validation.required");
    if (!formData.email.trim()) newErrors.email = t("validation.required");
    if (!formData.password.trim()) newErrors.password = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createUser(formData, accessToken);
      alert(t("users.created"));
      navigate("/users");
    } catch (error) {
      console.error(error);
      alert(t("errors.actionFailed") + "\n" + errorMessage(error));
    }
  };

  useEffect(() => {
    document.title = t("navigation.createUser");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.createUser")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.name")}
              </label>
              <input
                id="name"
                type="text"
                name="name"
                minLength={3}
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <ErrorMessage message={errors.name} />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.email")}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                maxLength={100}
                value={formData.email}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <ErrorMessage message={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.password")}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                minLength={8}
                maxLength={255}
                value={formData.password}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <ErrorMessage message={errors.password} />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.role")}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="user">{t("users.roles.user")}</option>
                <option value="admin">{t("users.roles.admin")}</option>
              </select>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                {t("common.active")}
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                role="button"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
              >
                {t("navigation.createUser")}
              </button>
              <button
                role="button"
                type="button"
                onClick={() => navigate("/users")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
