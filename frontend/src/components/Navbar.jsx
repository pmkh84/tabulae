import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/useAuth";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import { t } from "../i18n/index.js";
import { translateNotification } from "../i18n/notifications.js";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeNotification, setActiveNotification] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Load notification history from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("notifications") || "[]");
    setNotifications(stored);
  }, []);

  // WebSocket
  useWebSocket((message) => {
    setNotifications((prev) => {
      const updated = [message, ...prev.slice(0, 4)];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
    setActiveNotification(true);
  });

  const navigation = [
    { name: t("navigation.dashboard"), href: "/dashboard" },
    {
      name: t("navigation.products"),
      href: "/products",
      submenu: [
        { name: t("common.list"), href: "/products/list" },
        user?.role === "admin" && {
          name: t("navigation.createProduct"),
          href: "/products/new",
        },
        { name: t("navigation.expiringProducts"), href: "/expiration?preset=expiring_soon" },
        user?.role === "admin" && {
          name: t("navigation.categories"),
          href: "/categories",
        },
      ].filter(Boolean),
    },
    {
      name: t("navigation.stockMovements"),
      href: "/stock-movements",
      submenu: [
        { name: t("common.list"), href: "/stock-movements/list" },
        { name: t("navigation.createMovement"), href: "/stock-movements/new" },
      ],
    },
    {
      name: t("navigation.warehouses"),
      href: "/warehouses",
      submenu: [
        { name: t("common.list"), href: "/warehouses/list" },
        user?.role === "admin" && {
          name: t("navigation.createWarehouse"),
          href: "/warehouses/new",
        },
      ].filter(Boolean),
    },
  ];

  if (user?.role === "admin") {
    navigation.push({
      name: t("navigation.users"),
      href: "/users",
      submenu: [
        { name: t("common.list"), href: "/users" },
        { name: t("navigation.createUser"), href: "/users/new" },
      ],
    });
  }

  return (
    <Disclosure as="nav" aria-label={t("navigation.main")} className="bg-indigo-600">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 start-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="sr-only">{t("navigation.openMainMenu")}</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Main navigation */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ms-6 sm:block">
              <div className="flex gap-4">
                {navigation.map((item) => {
                  if (!item.submenu) {
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? "bg-indigo-800 text-white"
                            : "text-gray-300 hover:bg-indigo-700 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium"
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  }

                  // Render submenu
                  return (
                    <Menu
                      as="div"
                      key={item.name}
                      className="relative inline-block text-start"
                    >
                      <div className="flex items-center">
                        <Link
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? "bg-indigo-900 text-white"
                              : "text-gray-300 hover:bg-indigo-700 hover:text-white",
                            "rounded-s-md px-3 py-2 text-sm font-medium"
                          )}
                        >
                          {item.name}
                        </Link>
                        <MenuButton
                          aria-label={t("navigation.toggleSubmenu", { name: item.name })}
                          className="rounded-e-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-indigo-700 hover:text-white"
                        >
                          <span aria-hidden="true">▾</span>
                        </MenuButton>
                      </div>
                      <MenuItems className="absolute start-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                        {item.submenu.map((subitem) => (
                          <MenuItem key={subitem.href}>
                            <Link
                              to={subitem.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {subitem.name}
                            </Link>
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notifications and user menu */}
          <div className="absolute inset-y-0 end-0 flex items-center pe-2 sm:static sm:inset-auto sm:ms-6 sm:pe-0">
            <div className="relative">
              <button
                type="button"
                className="relative"
                aria-expanded={showDropdown}
                aria-controls="shell-notifications"
                onClick={() => {
                  setShowDropdown((prev) => !prev);
                  setActiveNotification(false);
                }}
              >
                <span className="sr-only">{t("notifications.view")}</span>
                <BellIcon aria-hidden="true" className="size-6 text-white" />
                {activeNotification && (
                  <span aria-hidden="true" className="absolute top-0 end-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
                )}
              </button>

              {showDropdown && (
                <div id="shell-notifications" role="region" aria-labelledby="shell-notifications-title" className="absolute end-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
                  <h3 id="shell-notifications-title" className="text-sm font-semibold text-gray-700 mb-2">
                    {t("notifications.title")}
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-600 max-h-48 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="italic text-gray-400">
                        {t("notifications.empty")}
                      </li>
                    ) : (
                      notifications.map((message, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center hover:bg-gray-100 p-1 rounded"
                        >
                          <button
                            type="button"
                            className="flex-1 text-start cursor-pointer"
                            onClick={() => navigate("/stock-movements/list", { state: { refreshAt: Date.now() } })}
                          >
                            <span dir="auto">• {translateNotification(message)}</span>
                          </button>
                          <button
                            type="button"
                            aria-label={t("notifications.dismiss")}
                            className="text-lg text-red-500 hover:text-red-700 ms-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = notifications.filter(
                                (_, i) => i !== idx
                              );
                              setNotifications(updated);
                              localStorage.setItem(
                                "notifications",
                                JSON.stringify(updated)
                              );
                            }}
                          >
                            <span aria-hidden="true">✕</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <Menu as="div" className="relative ms-3">
              <div>
                <MenuButton className="relative flex items-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 focus:outline-hidden hover:bg-indigo-700 hover:text-white">
                  <span className="sr-only">{t("navigation.openUserMenu")}</span>
                  <bdi>{user?.name || t("common.user")}</bdi>
                </MenuButton>
              </div>
              <MenuItems className="absolute end-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5">
                <MenuItem>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t("navigation.profile")}
                  </Link>
                </MenuItem>
                <MenuItem>
                  <button
                    role="button"
                    onClick={logout}
                    className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t("navigation.logout")}
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => {
            if (!item.submenu) {
              return (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? "bg-indigo-800 text-white"
                      : "text-gray-300 hover:bg-indigo-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                >
                  {item.name}
                </DisclosureButton>
              );
            }

            return (
              <Disclosure key={item.name} as="div" className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2">
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:bg-indigo-700 hover:text-white rounded-md text-base font-medium"
                  >
                    {item.name}
                  </Link>
                  <DisclosureButton aria-label={t("navigation.toggleSubmenu", { name: item.name })} className="text-gray-300 hover:text-white">
                    <svg
                      aria-hidden="true"
                      className="ms-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </DisclosureButton>
                </div>

                <DisclosurePanel className="space-y-1 ps-4">
                  {item.submenu.map((subitem) => (
                    <Link
                      key={subitem.href}
                      to={subitem.href}
                      className="block text-gray-300 hover:bg-indigo-700 hover:text-white rounded-md px-3 py-2 text-sm"
                    >
                      {subitem.name}
                    </Link>
                  ))}
                </DisclosurePanel>
              </Disclosure>
            );
          })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
