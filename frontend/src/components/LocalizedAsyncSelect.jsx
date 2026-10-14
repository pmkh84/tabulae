import AsyncSelect from "react-select/async";
import { t } from "../i18n/index.js";
import { selectLiveMessages, selectResultStatus } from "../i18n/select.js";

export default function LocalizedAsyncSelect(props) {
  return (
    <AsyncSelect
      {...props}
      isRtl
      placeholder={props.placeholder ?? t("select.placeholder")}
      loadingMessage={() => t("select.loading")}
      noOptionsMessage={() => t("select.empty")}
      screenReaderStatus={selectResultStatus}
      ariaLiveMessages={selectLiveMessages}
      formatOptionLabel={props.formatOptionLabel ?? ((option) => <bdi>{option.label}</bdi>)}
      styles={{
        ...props.styles,
        menuPortal: (base, state) => ({
          ...(props.styles?.menuPortal ? props.styles.menuPortal(base, state) : base),
          direction: "rtl",
          textAlign: "start",
          fontFamily: "var(--font-sans)",
        }),
      }}
    />
  );
}
