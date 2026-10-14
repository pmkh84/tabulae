// Main App Component: App.jsx
import AppRouter from "./router/AppRouter";
import { direction, language } from "./i18n/index.js";
import { localizeNativeValidation, clearLocalizedValidation } from "./i18n/nativeValidation.js";

/*
<AppRouter /> is rendered inside this container, which means that 
everything displayed in the app is controlled by the routes defined there.
*/

function App() {
  return (
    <div lang={language} dir={direction} onInvalid={localizeNativeValidation} onInput={clearLocalizedValidation} className="min-h-screen bg-gray-100">
      <AppRouter />
    </div>
  );
}

export default App;
